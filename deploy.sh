#!/bin/bash

# ChainVotes Deployment Script
# This script handles the deployment of both smart contracts and frontend
set -e  # Exit on any error

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory paths
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$BASE_DIR/frontend"
CONTRACT_DIR="$FRONTEND_DIR/contracts"
ENV_FILE="$CONTRACT_DIR/.env"

# ==========================================
# Helper functions
# ==========================================
print_header() {
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}${1}${NC}"
    echo -e "${BLUE}====================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

check_dependencies() {
    print_header "Checking dependencies"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18 or later."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2)
    if [[ $(echo "$NODE_VERSION" | cut -d. -f1) -lt 18 ]]; then
        print_warning "Node.js version is $NODE_VERSION. Recommended version is v18 or later."
    else
        print_success "Node.js v$NODE_VERSION installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_success "npm $(npm -v) installed"
    
    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        print_warning "No .env file found at $ENV_FILE"
        echo "Creating example .env file..."
        cp $CONTRACT_DIR/.env.example $ENV_FILE 2>/dev/null || echo -e "SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key\nPRIVATE_KEY=your-private-key-here\nETHERSCAN_API_KEY=your-etherscan-key-here\nREPORT_GAS=true" > $ENV_FILE
        print_warning "Please edit $ENV_FILE with your own values before proceeding."
        exit 1
    fi
    print_success "Environment file found"
}

install_dependencies() {
    print_header "Installing dependencies"
    
    echo "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    print_success "Frontend dependencies installed"
    
    echo "Installing contract dependencies..."
    cd "$CONTRACT_DIR"
    npm install
    print_success "Contract dependencies installed"
    
    cd "$BASE_DIR"
}

deploy_contracts() {
    print_header "Deploying smart contracts"
    
    cd "$CONTRACT_DIR"
    
    # Check if private key is set
    if grep -q "your-private-key-here\|PRIVATE_KEY=" "$ENV_FILE"; then
        print_error "Please set your private key in $ENV_FILE"
        exit 1
    fi
    
    # Check if RPC URL is set
    if grep -q "your-api-key\|SEPOLIA_RPC_URL=" "$ENV_FILE"; then
        print_error "Please set your Sepolia RPC URL in $ENV_FILE"
        exit 1
    fi
    
    echo "Compiling contracts..."
    npx hardhat compile
    print_success "Contracts compiled"
    
    echo "Deploying contracts to Sepolia testnet..."
    npx hardhat run scripts/deploy.ts --network sepolia
    
    # Check if deployment was successful by looking for the address in the output
    if [[ -f "$FRONTEND_DIR/src/lib/contracts/voting.ts" ]]; then
        CONTRACT_ADDRESS=$(grep -o "'0x[a-fA-F0-9]\{40\}'" "$FRONTEND_DIR/src/lib/contracts/voting.ts" | tr -d "'" | head -1)
        if [[ ! -z "$CONTRACT_ADDRESS" ]]; then
            print_success "Contract deployed to: $CONTRACT_ADDRESS"
            
            # Verify on Etherscan if API key is available
            if ! grep -q "your-etherscan-key-here\|ETHERSCAN_API_KEY=" "$ENV_FILE"; then
                echo "Verifying contract on Etherscan..."
                sleep 30  # Wait for the transaction to be confirmed
                npx hardhat verify --network sepolia $CONTRACT_ADDRESS || print_warning "Verification failed. You can try manually later."
            else
                print_warning "Etherscan API key not set. Skipping verification."
            fi
        else
            print_warning "Contract deployment didn't output an address or updated voting.ts file."
        fi
    else
        print_error "Contract deployment failed or voting.ts file was not updated."
        exit 1
    fi
    
    cd "$BASE_DIR"
}

build_frontend() {
    print_header "Building frontend"
    
    cd "$FRONTEND_DIR"
    
    # Ensure the contract address is in the configuration
    if [[ ! -f "$FRONTEND_DIR/src/lib/contracts/voting.ts" ]]; then
        print_error "Contract configuration file not found. Deploy the contract first."
        exit 1
    fi
    
    # Build the frontend
    echo "Building Next.js application..."
    npm run build
    
    print_success "Frontend built successfully"
    cd "$BASE_DIR"
}

start_frontend() {
    print_header "Starting frontend"
    
    cd "$FRONTEND_DIR"
    npm run start
}

# ==========================================
# Main script execution
# ==========================================

# Display banner
cat << "EOF"
 ___ _           _      __   __    _           
/ __| |_  __ _(_)_ _  \ \ / /__ | |_ ___ ___
| (__| ' \/ _` | | ' \  \ V / _ \|  _/ -_|_-<
\___|_||_\__,_|_|_||_|  \_/\___/ \__\___/__/
                                             
Secure blockchain voting platform deployment script
EOF

echo ""

# Parse arguments
DEPLOY_CONTRACTS=false
BUILD_FRONTEND=false
START_FRONTEND=false

if [[ $# -eq 0 ]]; then
    DEPLOY_CONTRACTS=true
    BUILD_FRONTEND=true
    START_FRONTEND=true
else
    for arg in "$@"; do
        case $arg in
            --contracts)
                DEPLOY_CONTRACTS=true
                ;;
            --frontend)
                BUILD_FRONTEND=true
                ;;
            --start)
                START_FRONTEND=true
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --contracts    Deploy smart contracts to Sepolia"
                echo "  --frontend     Build the frontend"
                echo "  --start        Start the frontend server"
                echo "  --help         Show this help message"
                echo ""
                echo "If no options are provided, all steps will be executed."
                exit 0
                ;;
            *)
                print_error "Unknown option: $arg"
                echo "Use --help to see available options."
                exit 1
                ;;
        esac
    done
fi

# Check dependencies
check_dependencies

# Install dependencies
install_dependencies

# Deploy contracts if requested
if [[ "$DEPLOY_CONTRACTS" == true ]]; then
    deploy_contracts
fi

# Build frontend if requested
if [[ "$BUILD_FRONTEND" == true ]]; then
    build_frontend
fi

# Start frontend if requested
if [[ "$START_FRONTEND" == true ]]; then
    start_frontend
fi

print_header "Deployment completed!"