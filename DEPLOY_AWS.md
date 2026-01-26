# Deploying Medical Aesthetics Platform to AWS (EC2)

This guide explains how to deploy the full stack (Frontend, Backend, Database, Redis) to an AWS EC2 instance using Docker Compose.

## Prerequisites

1.  **AWS Account**: You need access to the AWS Console.
2.  **Domain Name (Optional)**: If you want a custom domain (e.g., `app.ebizz.com`), you'll need one managed via Route53 or another registrar.

## Step 1: Launch an EC2 Instance

1.  Go to **EC2 Dashboard** > **Launch Instance**.
2.  **Name**: `MedicalAestheticsServer`.
3.  **OS Image**: **Ubuntu Server 22.04 LTS**.
4.  **Instance Type**: `t3.medium` (Recommended minimum: 2 vCPUs, 4GB RAM) or `t3.small` if budget is tight (might be slow for builds).
5.  **Key Pair**: Create a new key pair (e.g., `ebizz-key`), download the `.pem` file.
6.  **Network Settings**:
    *   Allow SSH traffic from **My IP**.
    *   Allow HTTP traffic from the internet.
    *   Allow HTTPS traffic from the internet.
7.  Launch the instance.

## Step 2: Connect to the Server

Open your terminal (PowerShell or Git Bash on Windows):

```bash
# Set permissions for your key (if on Linux/Mac/Git Bash)
chmod 400 ebizz-key.pem

# SSH into the server
ssh -i "path/to/ebizz-key.pem" ubuntu@<your-ec2-public-ip>
```

## Step 3: Install Docker & Docker Compose

Run these commands on the server:

```bash
# Update packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Check if docker works
sudo docker run hello-world
```

## Step 4: Deploy the Application

You have two options to get your code onto the server: **Git** (Recommended) or **SCP** (Copy files).

### Option A: Using Git (Recommended)

1.  Push your code to a repository (GitHub/GitLab).
2.  Clone it on the server:
    ```bash
    git clone https://github.com/your-username/medical-aesthetics-backend.git
    cd medical-aesthetics-backend
    ```

### Option B: Copy Files Manually

From your local machine:
```bash
scp -i "ebizz-key.pem" -r . ubuntu@<your-ec2-ip>:~/app
```

### Configure Environment

1.  Create the production `.env` file:
    ```bash
    cp .env.example .env
    nano .env
    ```
2.  Update the values for production:
    *   `DATABASE_HOST=postgres`
    *   `REDIS_HOST=redis`
    *   `NODE_ENV=production`
    *   Set secure passwords for `DATABASE_PASSWORD` and `REDIS_PASSWORD`.

## Step 5: Start the Application

Run the production docker-compose file:

```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1.  Build the Backend image.
2.  Build the Frontend image (compiling React to static files).
3.  Start Postgres, Redis, Backend, and Frontend (Nginx).

## Step 6: Verify

1.  Open your browser and visit `http://<your-ec2-public-ip>`.
    *   You should see the Login page.
2.  The API is available at `http://<your-ec2-public-ip>/api`.

## Troubleshooting

- **View Logs**: `sudo docker compose -f docker-compose.prod.yml logs -f`
- **Restart**: `sudo docker compose -f docker-compose.prod.yml restart`
- **Stop**: `sudo docker compose -f docker-compose.prod.yml down`
- **Migration Issues**: The migrations should run automatically on startup because `npm run start:prod` is the command, but checking `package.json`, ensure migrations run.
    *   You can manually run migrations inside the container:
        ```bash
        sudo docker exec -it medical-aesthetics-backend npm run migration:prod
        ```
