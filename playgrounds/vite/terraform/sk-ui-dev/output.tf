# Output values for Cloud Run configuration

# Cloud Run service URLs
output "cloud_run_service_urls" {
  description = "URLs of the deployed Cloud Run services"
  value = {
    for region, service in google_cloud_run_v2_service.default :
    region => service.uri
  }
}

# Cloud Run service status
output "cloud_run_service_status" {
  description = "Status of the Cloud Run services"
  value = {
    for region, service in google_cloud_run_v2_service.default :
    region => service.conditions
  }
}

# Load Balancer IP address (из ресурса)
output "load_balancer_ip_address" {
  description = "Global static IP address of the load balancer"
  value       = google_compute_global_address.widget.address
}

# Load Balancer URL
output "load_balancer_url" {
  description = "HTTPS URL of the load balancer"
  value       = "https://${var.ssl_host}"
}

# Service account email
output "service_account_email" {
  description = "Email address of the service account used by Cloud Run"
  value       = google_service_account.cloud_run_service_account.email
}

# Network Endpoint Groups
output "network_endpoint_groups" {
  description = "Serverless Network Endpoint Group IDs"
  value = {
    for region, neg in google_compute_region_network_endpoint_group.serverless_neg :
    region => neg.id
  }
}

# Cloud Run service names
output "cloud_run_service_names" {
  description = "Names of the Cloud Run services"
  value = {
    for region, service in google_cloud_run_v2_service.default :
    region => service.name
  }
}

# Cloud Run service locations
output "cloud_run_service_locations" {
  description = "Locations of the Cloud Run services"
  value = {
    for region, service in google_cloud_run_v2_service.default :
    region => service.location
  }
}

# External IPv4 address from module
output "load_balancer_external_ip" {
  description = "The external IPv4 assigned to the global forwarding rule"
  value       = module.lb-http.external_ip
}

# SSL Certificate outputs
output "ssl_certificate_name" {
  description = "Name of the managed SSL certificate"
  value       = try(module.lb-http.google_compute_managed_ssl_certificate.default[0].name, "widget-cert")
}

# External IPv6 address from module
output "load_balancer_external_ipv6" {
  description = "The external IPv6 assigned to the global forwarding rule"
  value       = module.lb-http.external_ipv6_address
}

# HTTP proxy from module
output "load_balancer_http_proxy" {
  description = "The HTTP proxy used by the load balancer"
  value       = module.lb-http.http_proxy
}

# HTTPS proxy from module
output "load_balancer_https_proxy" {
  description = "The HTTPS proxy used by the load balancer"
  value       = module.lb-http.https_proxy
}

# IPv6 configuration status
output "load_balancer_ipv6_enabled" {
  description = "Whether IPv6 configuration is enabled on the load balancer"
  value       = module.lb-http.ipv6_enabled
}

# URL map from module
output "load_balancer_url_map" {
  description = "The URL map used by the load balancer"
  value       = module.lb-http.url_map
}

# IAM binding status
output "public_access_iam_bindings" {
  description = "IAM binding information for public access"
  value = {
    for region, binding in google_cloud_run_v2_service_iam_binding.public_access :
    region => {
      service_name = binding.name
      location     = binding.location
      role         = binding.role
      members      = binding.members
    }
  }
}

output "regions_deployed" {
  description = "List of regions where Cloud Run services are deployed"
  value       = var.additional_regions
}

# IP address ID для reference
output "global_ip_address_id" {
  description = "ID of the global IP address"
  value       = google_compute_global_address.widget.id
}

# IP address name
output "global_ip_address_name" {
  description = "Name of the global IP address"
  value       = google_compute_global_address.widget.name
}

# Service account ID
output "service_account_id" {
  description = "ID of the service account"
  value       = google_service_account.cloud_run_service_account.account_id
}

# Service account unique ID
output "service_account_unique_id" {
  description = "Unique ID of the service account"
  value       = google_service_account.cloud_run_service_account.unique_id
}