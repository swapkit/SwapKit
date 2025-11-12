# Terraform configuration with required providers
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.34.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "5.34.0"
    }
  }
}

# Configure the Google Cloud provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Configure the Google Cloud Beta provider for newer features
provider "google-beta" {
  project = var.project_id
  region  = var.region
}

#
# Cloud Run Service Configuration
#

# Service account for Cloud Run service execution
resource "google_service_account" "cloud_run_service_account" {
  provider     = google-beta
  account_id   = "${var.service_name}-sa"
  display_name = "Service Account for ${var.service_name} Cloud Run Service"
}

# IAM permission for secret access
resource "google_project_iam_member" "cloud_run_secret_access" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

# Cloud Run service definition
resource "google_cloud_run_v2_service" "default" {
  provider = google-beta

  for_each = toset(var.additional_regions)

  name         = "${var.service_name}-${each.key}"
  location     = each.key
  launch_stage = "BETA"
  ingress      = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_service_account.email
    timeout         = "300s"

    containers {
      name  = var.service_name
      image = var.image_url

      # Startup probe to check container readiness
      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 240
        period_seconds        = 240
        failure_threshold     = 1
        tcp_socket {
          port = 8080
        }
      }

      # Liveness probe for health checking
      liveness_probe {
        initial_delay_seconds = 30
        timeout_seconds       = 30
        period_seconds        = 300
        failure_threshold     = 3
        http_get {
          path = "/health"
          port = 8080
        }
      }
    }
    
    # VPC access configuration for private network
    vpc_access {
      egress = "ALL_TRAFFIC"
      network_interfaces {
        network    = "projects/${var.project_id}/global/networks/${var.network_name}"
        subnetwork = "projects/${var.project_id}/regions/${each.key}/subnetworks/ops-${each.key}"
      }
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes = [
    ]
  }
}

#
# Public Access Configuration
#

# IAM binding to grant public access to Cloud Run services
resource "google_cloud_run_v2_service_iam_binding" "public_access" {
  provider = google-beta

  for_each = google_cloud_run_v2_service.default

  name     = each.value.name # Use the full resource ID instead of name
  location = each.value.location
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

#
# Global Load Balancer Configuration
#

# Reserve global static external IP address
resource "google_compute_global_address" "widget" {
  project = var.project_id
  name    = "${var.service_name}-globalip"
}

# Serverless Network Endpoint Groups for Load Balancer integration
resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  provider              = google-beta
  for_each              = google_cloud_run_v2_service.default
  name                  = "neg-${var.service_name}-${each.key}"
  network_endpoint_type = "SERVERLESS"
  region                = each.key
  cloud_run {
    service = each.value.name
  }
}

# HTTP Load Balancer module for global traffic distribution
module "lb-http" {
  source  = "GoogleCloudPlatform/lb-http/google//modules/serverless_negs"
  version = "~> 9.0"

  project = var.project_id
  name    = var.service_name

  create_address = false
  address        = google_compute_global_address.widget.address

  ssl                             = true
  managed_ssl_certificate_domains = [var.ssl_host]
  https_redirect                  = true

  backends = {
    default = {
      description = null
      groups = [
        for neg in google_compute_region_network_endpoint_group.serverless_neg :
        {
          group = neg.id
        }
      ]
      enable_cdn              = false
      security_policy         = null
      custom_request_headers  = null
      custom_response_headers = null

      iap_config = {
        enable               = false
        oauth2_client_id     = null
        oauth2_client_secret = null
      }
      log_config = {
        enable      = false
        sample_rate = null
      }
    }
  }
}
