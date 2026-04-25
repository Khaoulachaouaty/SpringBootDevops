#!/bin/bash
# Run this ONCE after creating the namespace.
# Secrets are NOT stored in git — managed manually via kubectl.

kubectl create namespace clinique --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic clinique-secrets \
  --namespace=clinique \
  --from-literal=mysql-root-password="${MYSQL_ROOT_PASSWORD}" \
  --from-literal=grafana-admin-password="${GRAFANA_ADMIN_PASSWORD:-admin}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secrets created in namespace clinique"
