variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "sk-ui-dev"
}

variable "network_name" {
  description = "VPC network name"
  type        = string
  default     = "sk-ui-dev-operations"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "ssl_host" {
  description = "DNS name for the SSL certificate"
  type        = string
  default     = "widget-dev-lb.swapkit.dev"
}

variable "additional_regions" {
  description = "Regions for widget deployment"
  type        = list(string)
  default     = ["us-central1", "europe-west1"]
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "widget"
}

variable "image_url" {
  description = "Container image URL"
  type        = string
}

variable "use_public_ip" {
  description = "Use public IP for Cloud SQL"
  type        = bool
  default     = true
}

variable "authorized_networks" {
  description = "Authorized CIDR blocks"
  type        = map(string)
  default = {
    "192.168.1.0/24" = "Office Network"
  }
}