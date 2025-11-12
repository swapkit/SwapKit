terraform {
  backend "gcs" {
    bucket = "sk-frontend-terraform-be"
    prefix = "terraform/state/sk-ui-dev/widget/"
  }
}