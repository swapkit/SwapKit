variable "project_id" {
  description = "The Google Cloud project ID for deployment."
  type        = string
  default     = "sk-ui-dev"
}

variable "region" {
  description = "The Google Cloud region."
  type        = string
  default     = "us-central1"
}

variable "trigger_name" {
  description = "Cloud Build trigger name."
  type        = string
  default     = "deploy-widget"
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