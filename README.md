# Clinique — Full-Stack DevOps Project

A clinic management system (appointments, consultations, medical records, billing) deployed through a complete end-to-end DevOps chain.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DevOps Chain                             │
│                                                                 │
│  GitHub Projects  →  Git/GitHub  →  GitHub Actions CI          │
│                                         │                       │
│                                    ┌────▼─────┐                 │
│                                    │ SonarCloud│ (quality)      │
│                                    │  Trivy    │ (security)     │
│                                    │  OWASP    │ (deps)         │
│                                    └────┬─────┘                 │
│                                         │ Docker push           │
│                                    ┌────▼─────┐                 │
│                                    │ Docker Hub│                 │
│                                    └────┬─────┘                 │
│                                         │ GitOps                │
│                                    ┌────▼─────┐                 │
│                                    │  ArgoCD   │ (auto-sync)    │
│                                    └────┬─────┘                 │
│                                         │                       │
│                              ┌──────────▼──────────┐           │
│                              │   Kubernetes (k8s)   │           │
│                              │                      │           │
│                              │  frontend (nginx:80)  │           │
│                              │  backend  (java:8082) │           │
│                              │  mysql    (3306)      │           │
│                              │  prometheus           │           │
│                              │  grafana  (:3000)     │           │
│                              └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, TypeScript, Bootstrap 5 |
| Backend | Spring Boot 4, Java 17, Maven |
| Database | MySQL 8 |
| Containerization | Docker, docker-compose |
| Orchestration | Kubernetes (Minikube) |
| GitOps / CD | ArgoCD |
| CI | GitHub Actions |
| Code Quality | SonarCloud, Checkstyle |
| Security | Trivy, OWASP Dependency Check, GitHub Secrets |
| Monitoring | Prometheus, Grafana |

---

## Project Structure

```
.
├── backend/                 Spring Boot application
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                Angular application
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── k8s/                     Kubernetes manifests (GitOps source)
│   ├── namespace.yaml
│   ├── backend/
│   ├── frontend/
│   ├── mysql/
│   ├── monitoring/
│   └── argocd/
├── .github/workflows/
│   └── ci.yml               CI pipeline
└── docker-compose.yml       Local development
```

---

## Local Run (Docker Compose)

**Prerequisites:** Docker + Docker Compose

```bash
# Clone and start
git clone https://github.com/<your-username>/SpringBootDevops.git
cd SpringBootDevops

# Copy env file and fill in passwords
cp .env.example .env

# Start all services
docker-compose up --build

# App is available at:
# Frontend: http://localhost
# Backend:  http://localhost:8082/clinique
# Metrics:  http://localhost:8082/clinique/actuator/prometheus
```

---

## Kubernetes Deployment (Minikube + ArgoCD)

```bash
# Start Minikube
minikube start

# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply ArgoCD application (points to k8s/ folder)
kubectl apply -f k8s/argocd/application.yaml

# ArgoCD auto-syncs — no manual kubectl apply needed after this
# Access ArgoCD UI:
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access the app:
minikube service clinique-frontend -n clinique
```

---

## CI Pipeline (GitHub Actions)

Every push to `main` or `dev` triggers:

1. **Backend CI** — Checkstyle lint → unit tests → JAR build → SonarCloud → Docker build & push
2. **Frontend CI** — ESLint → Karma tests → production build → Docker build & push
3. **Security** — OWASP dependency check → npm audit → Trivy image scan (fails on CRITICAL CVEs)

Required GitHub Secrets:

| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `SONAR_TOKEN` | SonarCloud token |
| `SONAR_ORGANIZATION` | SonarCloud org key |
| `SONAR_PROJECT_KEY` | SonarCloud project key |
| `MYSQL_ROOT_PASSWORD` | DB password for containers |

---

## Monitoring

- **Prometheus** scrapes `/clinique/actuator/prometheus` every 15s
- **Grafana** dashboard (Spring Boot JVM metrics — ID 4701) at `http://minikube-ip:30030`
- Alert rule: fires if no HTTP requests received for 5 minutes

---

## Roles

| Role | Capabilities |
|---|---|
| Admin | Manage doctors, view all appointments |
| Doctor | Calendar, consultations, patient records, invoices |
| Patient | Book appointments, view medical record, pay invoices |

---

## Git Workflow

```
main   ← production (protected)
dev    ← integration
feat/* ← feature branches → PR to dev → merge to main
```
