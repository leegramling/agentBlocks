#!/bin/bash

# Install dependencies for AgentBlocks Desktop Client (Tauri + GTK)

echo "🔧 Installing system dependencies for Tauri..."

# Detect the distribution
if command -v apt &> /dev/null; then
    echo "📦 Detected Debian/Ubuntu - using apt"
    
    # Update package list
    sudo apt update
    
    # Install the correct webkit package for Ubuntu 24.04
    sudo apt install -y \
        libgtk-3-dev \
        libwebkit2gtk-4.1-dev \
        libssl-dev \
        libayatana-appindicator3-dev \
        librsvg2-dev \
        build-essential \
        curl \
        wget \
        file
        
    echo "✅ Ubuntu/Debian dependencies installed!"
    
elif command -v dnf &> /dev/null; then
    echo "📦 Detected Fedora/RHEL - using dnf"
    
    sudo dnf install -y \
        gtk3-devel \
        webkit2gtk4.1-devel \
        openssl-devel \
        libappindicator-gtk3-devel \
        librsvg2-devel \
        gcc \
        gcc-c++ \
        curl \
        wget \
        file
        
    echo "✅ Fedora/RHEL dependencies installed!"
    
elif command -v pacman &> /dev/null; then
    echo "📦 Detected Arch Linux - using pacman"
    
    sudo pacman -S \
        gtk3 \
        webkit2gtk-4.1 \
        openssl \
        libappindicator-gtk3 \
        librsvg \
        base-devel \
        curl \
        wget \
        file
        
    echo "✅ Arch Linux dependencies installed!"
    
else
    echo "❌ Unsupported distribution. Please install dependencies manually:"
    echo "   - GTK3 development libraries"
    echo "   - WebKit2GTK development libraries"
    echo "   - OpenSSL development libraries"
    echo "   - Build tools (gcc, make, etc.)"
    exit 1
fi

# Install Rust if not present
if ! command -v cargo &> /dev/null; then
    echo "🦀 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    echo "✅ Rust installed!"
else
    echo "✅ Rust already installed"
fi

# Install Tauri CLI
echo "⚡ Installing Tauri CLI..."
cargo install tauri-cli --version "^1.0"

echo ""
echo "🎉 All dependencies installed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. cd desktop-client"
echo "   2. cargo tauri dev     # For development"
echo "   3. cargo tauri build   # For production build"
echo ""
echo "🐍 To test the concept without GUI:"
echo "   python3 demo.py"