variable "project_id" {
  description = "The Google Cloud project ID for build."
  type        = string
  default     = "swapkit-devops"
}

variable "region" {
  description = "The Google Cloud region."
  type        = string
  default     = "us-central1"
}

variable "region_artifact" {
  description = "The Google Cloud region for Artifact Registry."
  type        = string
  default     = "us"
}

variable "trigger_name" {
  description = "Cloud Build trigger name."
  type        = string
  default     = "build-widget"
}

variable "branch_name" {
  description = "Branch name pattern."
  type        = string
  default     = "develop"
}

variable "branch_ref" {
  description = "Branch reference."
  type        = string
  default     = "refs/heads/develop"
}

variable "repository_name" {
  description = "Artifact Registry repository ID."
  type        = string
  default     = "widget"
}