terraform {
  backend "gcs" {
    bucket = "sk-frontend-terraform-be"
    prefix = "terraform/state/widget/sk-ui-dev/deploy-trigger/"
  }
}
