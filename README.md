# OpenHands: Code Less, Make More

OpenHands is an AI development platform that enables developers to build, deploy, and manage AI agents with minimal coding. This comprehensive platform combines a React/TypeScript frontend with a Python backend and uses containerization for deployment.

## Table of Contents

- [Project Overview](#project-overview)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Deployment](#deployment)
  - [Local Deployment](#local-deployment)
  - [Remote Server Deployment](#remote-server-deployment)
  - [Scaleway Deployment](#scaleway-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Project Overview

OpenHands is a comprehensive AI agent platform with the following key components:

- **Frontend**: A React/TypeScript web application for user interaction
- **Backend**: Python-based core services with AI capabilities
- **Microagents**: Knowledge and task management components
- **Containers**: Containerized deployment architecture

The platform is designed to simplify AI development by providing a unified environment for building, testing, and deploying AI agents. It leverages modern containerization technologies to ensure consistent deployment across different environments.

## System Requirements

### Minimum Requirements

- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB
- **Operating System**: Linux (Ubuntu 20.04 or newer recommended)
- **Docker**: 20.10.x or newer
- **Docker Compose**: 2.x or newer

### Recommended Requirements

- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 50GB+ SSD
- **Operating System**: Ubuntu 22.04 LTS
- **Docker**: Latest stable version
- **Docker Compose**: Latest stable version

### Software Dependencies

- **Python**: 3.12.x
- **Node.js**: 21.7.x or newer
- **npm**: 10.5.x or newer

## Installation

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/adampzb/OpenHands.git
   cd OpenHands
   ```

2. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. Set up the Python environment:
   ```bash
   # Install Poetry if not already installed
   pip install poetry==1.8.2
   
   # Install dependencies
   poetry install --without evaluation
   ```

4. Configure the application:
   ```bash
   # Create a configuration file from the template
   cp config.template.toml config.toml
   
   # Edit the configuration file as needed
   ```

5. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

6. Access the application at http://localhost:3000

## Deployment

### Local Deployment

For local deployment, the Docker Compose setup is recommended:

1. Ensure Docker and Docker Compose are installed
2. Configure the application in `config.toml`
3. Run `docker-compose up -d`
4. Access the application at http://localhost:3000

### Remote Server Deployment

For deploying to a remote server:

1. Ensure the server meets the system requirements
2. Install Docker and Docker Compose on the server
3. Clone the repository to the server
4. Configure the application in `config.toml`
5. Build and start the containers:
   ```bash
   docker-compose up -d
   ```
6. Configure a reverse proxy to expose the service (see detailed instructions below)

### Configuring a Reverse Proxy

When deploying OpenHands to a remote server, it's recommended to set up a reverse proxy to handle incoming traffic, provide SSL termination, and improve security. Below are detailed instructions for configuring Nginx as a reverse proxy for the OpenHands application.

#### Nginx Reverse Proxy Setup

1. **Install Nginx** on your server if not already installed:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Create an Nginx configuration file** for OpenHands:
   ```bash
   sudo nano /etc/nginx/sites-available/openhands
   ```

3. **Add the following configuration**, adjusting the `server_name` to match your domain:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable the site** by creating a symbolic link:
   ```bash
   sudo ln -s /etc/nginx/sites-available/openhands /etc/nginx/sites-enabled/
   ```

5. **Test the Nginx configuration**:
   ```bash
   sudo nginx -t
   ```

6. **Reload Nginx** to apply the changes:
   ```bash
   sudo systemctl reload nginx
   ```

#### Setting up SSL with Let's Encrypt

For production deployments, it's recommended to secure your site with SSL:

1. **Install Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain and install SSL certificates**:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Follow the prompts** to complete the certificate installation.

4. Certbot will automatically update your Nginx configuration to use SSL.

#### Docker Compose with Nginx Reverse Proxy

Alternatively, you can include Nginx in your Docker Compose setup for a fully containerized deployment:

1. **Create an Nginx configuration file** in your project directory:
   ```bash
   mkdir -p nginx/conf.d
   nano nginx/conf.d/default.conf
   ```

2. **Add the following configuration**:
   ```nginx
   server {
       listen 80;
       
       location / {
           proxy_pass http://openhands:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Update your docker-compose.yml** to include Nginx:
   ```yaml
   version: '3'
   
   services:
     openhands:
       build:
         context: ./
         dockerfile: ./containers/app/Dockerfile
       image: openhands:latest
       container_name: openhands-app
       environment:
         - SANDBOX_RUNTIME_CONTAINER_IMAGE=${SANDBOX_RUNTIME_CONTAINER_IMAGE:-docker.all-hands.dev/all-hands-ai/runtime:0.34-nikolaik}
         - WORKSPACE_MOUNT_PATH=${WORKSPACE_BASE:-$PWD/workspace}
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
         - ~/.openhands-state:/.openhands-state
         - ${WORKSPACE_BASE:-$PWD/workspace}:/opt/workspace_base
       pull_policy: build
       stdin_open: true
       tty: true
       networks:
         - app-network
     
     nginx:
       image: nginx:latest
       container_name: nginx-proxy
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/conf.d:/etc/nginx/conf.d
       depends_on:
         - openhands
       networks:
         - app-network
   
   networks:
     app-network:
       driver: bridge
   ```

4. **Start the containers** with Docker Compose:
   ```bash
   docker-compose up -d
   ```

#### Traefik as an Alternative

Traefik is another popular reverse proxy that works well with Docker:

1. **Create a `traefik.yml` file**:
   ```yaml
   api:
     dashboard: true
   
   entryPoints:
     web:
       address: ":80"
       http:
         redirections:
           entryPoint:
             to: websecure
             scheme: https
     websecure:
       address: ":443"
   
   providers:
     docker:
       endpoint: "unix:///var/run/docker.sock"
       exposedByDefault: false
   
   certificatesResolvers:
     letsencrypt:
       acme:
         email: your-email@example.com
         storage: /letsencrypt/acme.json
         httpChallenge:
           entryPoint: web
   ```

2. **Update your docker-compose.yml** to include Traefik:
   ```yaml
   version: '3'
   
   services:
     traefik:
       image: traefik:v2.9
       container_name: traefik
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
         - ./traefik.yml:/etc/traefik/traefik.yml
         - ./letsencrypt:/letsencrypt
       networks:
         - app-network
     
     openhands:
       build:
         context: ./
         dockerfile: ./containers/app/Dockerfile
       image: openhands:latest
       container_name: openhands-app
       environment:
         - SANDBOX_RUNTIME_CONTAINER_IMAGE=${SANDBOX_RUNTIME_CONTAINER_IMAGE:-docker.all-hands.dev/all-hands-ai/runtime:0.34-nikolaik}
         - WORKSPACE_MOUNT_PATH=${WORKSPACE_BASE:-$PWD/workspace}
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
         - ~/.openhands-state:/.openhands-state
         - ${WORKSPACE_BASE:-$PWD/workspace}:/opt/workspace_base
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.openhands.rule=Host(`your-domain.com`)"
         - "traefik.http.routers.openhands.entrypoints=websecure"
         - "traefik.http.routers.openhands.tls.certresolver=letsencrypt"
         - "traefik.http.services.openhands.loadbalancer.server.port=3000"
       networks:
         - app-network
   
   networks:
     app-network:
       driver: bridge
   ```

3. **Create a directory for Let's Encrypt certificates**:
   ```bash
   mkdir letsencrypt
   ```

4. **Start the containers** with Docker Compose:
   ```bash
   docker-compose up -d
   ```

### Scaleway Deployment

OpenHands can be deployed on Scaleway using their Serverless Containers service, which is ideal for this containerized application.

#### Option 1: Scaleway Serverless Containers (Recommended)

This option provides automatic scaling, reduced operational costs, and no infrastructure management.

1. Create a Scaleway account and set up billing
2. Create a Container Registry namespace on Scaleway
3. Build and push the OpenHands container:
   ```bash
   # Build the container
   docker build -t openhands:latest -f ./containers/app/Dockerfile .
   
   # Tag the container for Scaleway
   docker tag openhands:latest rg.fr-par.scw.cloud/your-namespace/openhands:latest
   
   # Push to Scaleway Container Registry
   docker push rg.fr-par.scw.cloud/your-namespace/openhands:latest
   ```
4. Deploy the container using Scaleway Console:
   - Go to Serverless > Containers
   - Create a new namespace if needed
   - Deploy a new container using your pushed image
   - Set the port to 3000
   - Configure resources based on your needs (start with 2 vCPU, 4GB RAM)
   - Set container privacy to public or private as needed
   - Configure environment variables from your config.toml

#### Option 2: Scaleway Instances

For more control or higher resource requirements:

1. Create a Scaleway account
2. Launch an Instance (recommended: DEV1-L with 4 vCPUs, 8GB RAM)
3. Install Docker and Docker Compose on the instance
4. Clone the repository and follow the Remote Server Deployment steps

#### Recommended Scaleway Configuration

For production use, we recommend:

- **Serverless Containers**:
  - Medium resources (2 vCPU, 4GB RAM)
  - Min scale: 1 (to avoid cold starts)
  - Max scale: Based on expected traffic
  - Request concurrency: 80

- **Instances** (if higher control is needed):
  - DEV1-L (4 vCPUs, 8GB RAM) for medium workloads
  - GP1-S (8 vCPUs, 32GB RAM) for heavy workloads

## Configuration

OpenHands is configured using a TOML configuration file. Copy the template and modify as needed:
```bash
cp config.template.toml config.toml
```
Key configuration sections:
- **LLM**: Configure language model providers and settings
- **Agent**: Configure agent behaviors and capabilities
- **Sandbox**: Configure the sandbox environment
- **Security**: Configure security features
- **Condenser**: Control conversation history management
For detailed configuration options, refer to the comments in the `config.template.toml` file.

## Storage and Database Configuration

OpenHands supports multiple storage backends that can be configured to work with Scaleway's database and storage services. This section provides detailed information on how to configure OpenHands to use Scaleway's managed databases and storage solutions.

### Storage Options in OpenHands

OpenHands supports several storage backends:

1. **Local Storage**: File-based storage on the local filesystem
2. **S3-Compatible Storage**: Compatible with Scaleway Object Storage
3. **Google Cloud Storage**: For Google Cloud deployments

For Scaleway deployments, we recommend using either local storage (for development/testing) or S3-compatible storage with Scaleway Object Storage (for production).

### Configuring Scaleway Managed Database

#### Setting Up PostgreSQL Database

1. **Create a Managed Database** in the Scaleway Console:
   - Go to the [Scaleway Console](https://console.scaleway.com)
   - Navigate to Databases > PostgreSQL
   - Click "Create a PostgreSQL database"
   - Choose a database name, region, and node type
   - For production workloads, select "Production-Optimized" nodes
   - Enable high availability for critical applications
   - Set up a strong admin password
   - Click "Create Database"

2. **Configure Database Connection** in OpenHands:
   - Update your `config.toml` file with the database connection details:
   ```toml
   [database]
   type = "postgresql"
   host = "your-db-instance.postgresql.db.scw.cloud"
   port = 5432
   name = "openhands"
   user = "your_username"
   password = "your_password"
   ssl_mode = "require"
   ```

3. **Create Required Tables**:
   - Connect to your database using a PostgreSQL client
   - Run the initialization scripts provided in the OpenHands repository
   ```bash
   psql -h your-db-instance.postgresql.db.scw.cloud -U your_username -d openhands -f init_scripts/schema.sql
   ```

#### Database Storage Options

Scaleway offers two types of storage for managed databases:

1. **Local Storage**:
   - Higher performance
   - Fixed size tied to the node type
   - Suitable for high-performance requirements

2. **Block Storage**:
   - More flexible scaling (up to 10TB)
   - Independent scaling of compute and storage
   - Better for cost optimization
   - Recommended for production deployments

For most OpenHands deployments, we recommend using Block Storage for its flexibility and scalability.

### Configuring Scaleway Object Storage

OpenHands can use Scaleway Object Storage for storing files, backups, and other persistent data.

1. **Create an Object Storage Bucket**:
   - Go to the Scaleway Console
   - Navigate to Object Storage
   - Create a new bucket with a unique name
   - Choose the "Multi-AZ Standard" storage class for production workloads
   - Set appropriate access permissions

2. **Configure S3 Credentials**:
   - Generate API keys in the Scaleway Console (IAM & Security > API Keys)
   - Make note of your Access Key and Secret Key

3. **Update OpenHands Configuration**:
   - Modify your `config.toml` file to use S3 storage:
   ```toml
   [storage]
   type = "s3"
   bucket = "your-bucket-name"
   region = "fr-par" # or nl-ams, pl-waw depending on your region
   endpoint = "s3.fr-par.scw.cloud" # adjust for your region
   access_key = "your_access_key"
   secret_key = "your_secret_key"
   ```

### Storage Class Recommendations

Scaleway offers different storage classes for Object Storage:

1. **Multi-AZ Standard**:
   - Recommended for production data
   - High availability across multiple availability zones
   - Higher cost but better reliability

2. **One Zone - IA (Infrequent Access)**:
   - Lower cost option for less critical data
   - Good for backups or easily recreatable data
   - Less redundancy than Multi-AZ

3. **Glacier**:
   - Lowest cost for archival storage
   - Slower access times
   - Good for long-term storage of infrequently accessed data

For OpenHands production deployments, we recommend using Multi-AZ Standard for critical data and One Zone - IA for backups and less critical data.

### Database Backup Strategy

#### Automated Backups

Scaleway Managed Databases provide automated backup features:

1. **For Local Storage Databases**:
   - Logical backups are created daily
   - Backups can be stored in a different region
   - No expiration date on backups

2. **For Block Storage Databases**:
   - Block snapshots are created almost instantaneously
   - Don't require much computing power
   - Allow creation of new instances from snapshots

Configure backup retention and scheduling in the Scaleway Console under your database instance settings.

#### Manual Backups

For additional safety, you can implement manual backups:

```bash
# For PostgreSQL databases
pg_dump -h your-db-instance.postgresql.db.scw.cloud -U your_username -d openhands > openhands_backup_$(date +%Y%m%d).sql

# Upload to Object Storage
aws s3 cp openhands_backup_$(date +%Y%m%d).sql s3://your-bucket-name/backups/ --endpoint-url=https://s3.fr-par.scw.cloud
```

### Scaling Considerations

#### Database Scaling

1. **Vertical Scaling**:
   - Upgrade to a larger node type in the Scaleway Console
   - For Block Storage databases, you can increase storage independently

2. **Read Scaling**:
   - Add read replicas to distribute read queries
   - Configure OpenHands to use read replicas for appropriate operations

#### Object Storage Scaling

Scaleway Object Storage scales automatically, but consider:

1. **Performance Optimization**:
   - Use appropriate prefixes for objects to distribute load
   - Consider using Scaleway's Edge Services for frequently accessed content

2. **Cost Optimization**:
   - Implement lifecycle policies to move older data to cheaper storage classes
   - Monitor usage with Scaleway Observability tools

### Monitoring and Maintenance

1. **Database Monitoring**:
   - Use Scaleway's built-in monitoring tools
   - Set up alerts for high CPU, memory usage, or storage thresholds

2. **Storage Monitoring**:
   - Monitor Object Storage usage through Scaleway Cockpit
   - Set up billing alerts to avoid unexpected costs

3. **Regular Maintenance**:
   - Keep database versions updated
   - Regularly test backup restoration procedures
   - Monitor query performance and optimize as needed

## Remote Access Guide

After deploying OpenHands to a remote server or Scaleway, you'll need to access it from your laptop or workstation. This section provides detailed instructions for securely accessing your OpenHands deployment.

### Accessing Web Interface

OpenHands provides a web interface that you can access from any device with a web browser.

#### For Local Deployment

If you've deployed OpenHands locally using Docker Compose:

1. Open your web browser
2. Navigate to `http://localhost:3000`
3. You should see the OpenHands login page

#### For Remote Server Deployment

If you've deployed OpenHands to a remote server with a reverse proxy:

1. Ensure your domain is properly configured to point to your server's IP address
2. Open your web browser
3. Navigate to `https://your-domain.com` (if you've set up SSL) or `http://your-domain.com`
4. You should see the OpenHands login page

#### For Scaleway Serverless Containers Deployment

If you've deployed using Scaleway Serverless Containers:

1. Open your web browser
2. Navigate to the URL provided by Scaleway after deployment (typically in the format `https://[container-id].functions.fnc.fr-par.scw.cloud`)
3. You should see the OpenHands login page

### Secure Remote Access Options

#### VPN Access

For enhanced security, consider setting up a VPN for accessing your OpenHands deployment:

1. **Set up a VPN server** on your deployment server or a separate server
   ```bash
   # Example using WireGuard on Ubuntu
   sudo apt update
   sudo apt install wireguard
   ```

2. **Configure the VPN server** following the WireGuard documentation

3. **Set up VPN clients** on your laptop and other devices that need access

4. **Connect to the VPN** before accessing OpenHands

#### SSH Tunneling

For temporary access without setting up a reverse proxy or VPN:

1. **Create an SSH tunnel** from your local machine to the server:
   ```bash
   ssh -L 8080:localhost:3000 user@your-server-ip
   ```

2. **Access OpenHands** through the tunnel:
   - Open your browser and navigate to `http://localhost:8080`

### API Access

If you need to access the OpenHands API from your applications:

1. **Find your API endpoint**:
   - Local: `http://localhost:3000/api`
   - Remote with domain: `https://your-domain.com/api`
   - Scaleway: `https://[container-id].functions.fnc.fr-par.scw.cloud/api`

2. **Authentication**:
   - Generate an API key in the OpenHands web interface
   - Include the API key in your requests:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://your-domain.com/api/endpoint
   ```

### Troubleshooting Remote Access

#### Cannot Connect to Server

1. **Check server status**:
   ```bash
   ssh user@your-server-ip
   docker ps | grep openhands
   ```

2. **Verify firewall settings**:
   ```bash
   sudo ufw status
   ```
   Ensure ports 80 and 443 (for HTTP/HTTPS) are open

3. **Check reverse proxy logs**:
   ```bash
   # For Nginx
   sudo tail -f /var/log/nginx/error.log
   
   # For Traefik
   docker logs traefik
   ```

#### SSL Certificate Issues

If you see certificate warnings:

1. **Verify certificate installation**:
   ```bash
   # For Nginx with Let's Encrypt
   sudo certbot certificates
   ```

2. **Renew certificates if expired**:
   ```bash
   sudo certbot renew
   ```

#### Performance Issues

If the interface is slow to load:

1. **Check server resources**:
   ```bash
   top
   df -h
   ```

2. **Review application logs**:
   ```bash
   docker logs openhands-app
   ```

3. **Consider scaling up** your Scaleway resources if consistently under heavy load

### Mobile Access

OpenHands web interface is responsive and works on mobile devices:

1. Open your mobile browser
2. Navigate to your OpenHands URL
3. Login with your credentials

For the best experience on mobile:
- Use a modern browser (Chrome, Safari, Firefox)
- Ensure you have a stable internet connection
- Consider creating a home screen shortcut for quick access

## Alternative Hosting Options

While Scaleway provides excellent hosting options for OpenHands, there are other cloud providers worth considering. This section compares hosting options from Hetzner and OVHcloud as alternatives.

### Hetzner Cloud Hosting Options

Hetzner offers cost-effective cloud server options that work well for hosting containerized applications like OpenHands.

#### Server Types

1. **Shared vCPU Intel (CX)** - Best price-performance ratio
   - Starting from $4.59/month
   - Ideal for development and testing environments
   - Good for small to medium workloads

2. **Shared vCPU AMD (CPX)** - Based on AMD Epyc processors
   - Starting from $5.09/month
   - Better multi-threading performance
   - Good for compute-intensive applications

3. **Shared vCPU Ampere (CAX)** - Arm64 architecture
   - Starting from $4.59/month
   - Energy-efficient option
   - Good for optimized ARM workloads

4. **Dedicated vCPU (CCX)** - Best for production workloads
   - Starting from $14.09/month
   - Dedicated resources with no noisy neighbors
   - Ideal for high-traffic applications and production environments

#### Recommended Configurations for OpenHands

| Workload Type | Recommended Plan | Specifications | Monthly Cost |
|---------------|------------------|----------------|--------------|
| Development   | CX21             | 2 vCPUs, 4GB RAM, 40GB NVMe | ~$8.90 |
| Small Production | CPX31        | 2 vCPUs, 8GB RAM, 80GB NVMe | ~$16.70 |
| Medium Production | CCX22       | 4 dedicated vCPUs, 16GB RAM, 160GB NVMe | ~$42.90 |
| High Performance | CCX32        | 8 dedicated vCPUs, 32GB RAM, 240GB NVMe | ~$76.90 |

#### Advantages of Hetzner

- Very competitive pricing (often 30-50% cheaper than major cloud providers)
- High-performance NVMe storage included
- Simple and transparent billing
- Data centers in Germany, Finland, USA, and Singapore
- No minimum contract period

#### Deployment Process

1. Create a Hetzner Cloud account
2. Select a server with Docker pre-installed or install Docker manually
3. Follow the standard OpenHands deployment instructions
4. Configure networking and firewall settings in Hetzner Cloud Console

### OVHcloud Hosting Options

OVHcloud offers both VPS solutions with Docker pre-installed and more advanced Public Cloud container services.

#### VPS Options

OVHcloud VPS with Docker pre-installed provides a streamlined environment for deploying containerized applications.

| Plan | vCPUs | RAM | Storage | Bandwidth | Price |
|------|-------|-----|---------|-----------|-------|
| VPS Starter | 1 vCore | 2 GB | 20 GB SSD SATA | 100 Mbps | $0.97/month (first year) |
| Value | 1 vCore | 2-4 GB | 40-80 GB SSD NVMe | 250 Mbps | $5.95/month |
| Essential | 2 vCores | 4-8 GB | 40-160 GB SSD NVMe | 500 Mbps | $10.62/month |
| Comfort | 4 vCores | 4-16 GB | 80-320 GB SSD NVMe | 1 Gbps | $15.98/month |
| Elite | 8 vCores | 8-32 GB | 160-640 GB SSD NVMe | 2 Gbps | $33.49/month |

#### Public Cloud Container Services

For more advanced container orchestration, OVHcloud offers Public Cloud container services:

1. **Managed Kubernetes Service**
   - Fully managed Kubernetes clusters
   - Automated deployment and scaling
   - Integrated with OVHcloud ecosystem
   - Pay-per-use pricing model

2. **Managed Private Registry**
   - Secure storage for Docker images
   - Based on Harbor (CNCF project)
   - Integrated authentication and security features

#### Recommended Configurations for OpenHands

| Workload Type | Recommended Plan | Specifications | Monthly Cost |
|---------------|------------------|----------------|--------------|
| Development   | Value            | 1 vCore, 4 GB RAM, 80 GB NVMe | ~$5.95 |
| Small Production | Essential     | 2 vCores, 8 GB RAM, 160 GB NVMe | ~$10.62 |
| Medium Production | Comfort      | 4 vCores, 16 GB RAM, 320 GB NVMe | ~$15.98 |
| High Performance | Elite         | 8 vCores, 32 GB RAM, 640 GB NVMe | ~$33.49 |

#### Advantages of OVHcloud

- Docker pre-installed on VPS options
- European-based cloud provider with global presence
- Strong focus on data sovereignty
- Competitive pricing compared to major cloud providers
- Managed Kubernetes option for larger deployments

#### Deployment Process

1. Create an OVHcloud account
2. Select a VPS with Docker pre-installed
3. Follow the standard OpenHands deployment instructions
4. For larger deployments, consider using OVHcloud's Managed Kubernetes Service

### Comparison with Scaleway

| Feature | Scaleway | Hetzner | OVHcloud |
|---------|----------|---------|----------|
| Starting Price | ~$5.00/month | ~$4.59/month | ~$5.95/month |
| Docker Support | Yes | Yes | Pre-installed |
| Kubernetes | Managed Kapsule | Manual setup | Managed Service |
| Storage Options | Block & Object | Local NVMe | Local NVMe & Object |
| Database Options | Managed DBs | Self-managed | Managed DBs |
| Global Presence | Europe | Europe, US, Asia | Global |
| Billing Model | Pay-as-you-go | Pay-as-you-go | Pay-as-you-go |

### Choosing the Right Provider

When selecting a hosting provider for OpenHands, consider these factors:

1. **Budget**: Hetzner generally offers the lowest prices, followed by OVHcloud and Scaleway.

2. **Performance Requirements**: 
   - For high-performance needs, consider Hetzner's dedicated vCPU options or OVHcloud Elite plans.
   - For balanced performance/cost, Scaleway's offerings provide good middle ground.

3. **Geographic Requirements**:
   - If your users are primarily in Europe, all three providers have strong European presence.
   - For global deployments, OVHcloud and Hetzner offer more global options.

4. **Management Overhead**:
   - If you prefer minimal setup, OVHcloud's Docker pre-installed VPS is ideal.
   - For more control, Hetzner's options provide excellent value.
   - For managed container orchestration, Scaleway's Kapsule or OVHcloud's Managed Kubernetes are good choices.

5. **Scaling Needs**:
   - For applications expected to grow significantly, consider providers with managed Kubernetes options.
   - For smaller deployments, any of the VPS options will work well.

For most OpenHands deployments, we recommend:
- **Development/Testing**: Hetzner CX21 or OVHcloud Value
- **Small Production**: OVHcloud Essential or Scaleway DEV1-M
- **Medium Production**: Hetzner CCX22 or OVHcloud Comfort
- **Large Production**: Scaleway with Kapsule or OVHcloud with Managed Kubernetes

## Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check Docker logs: `docker logs openhands-app`
   - Verify system resources meet requirements
   - Ensure all required environment variables are set

2. **Frontend not loading**:
   - Check if the frontend build was successful
   - Verify the container is running: `docker ps`
   - Check browser console for JavaScript errors

3. **API connection issues**:
   - Verify network connectivity
   - Check if the backend service is running
   - Verify API endpoints in the configuration

### Getting Help

If you encounter issues not covered here, please:

1. Check the project's GitHub issues for similar problems
2. Create a new issue with detailed information about your problem
3. Include logs, error messages, and environment details

## License

This project is licensed under the MIT License - see the LICENSE file for details.
