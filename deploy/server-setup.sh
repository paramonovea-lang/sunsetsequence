#!/usr/bin/env bash
# One-time setup of the site VPS (Ubuntu 22.04 or 24.04 LTS), run as the `claude` user with sudo:
#   ssh sunsetsequence 'sudo bash -s' < deploy/server-setup.sh
# Then install the Caddyfile and the launch password (see docs/09). Safe to run again.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "== system updates"
apt-get update -y
apt-get -o Dpkg::Options::=--force-confold upgrade -y
apt-get install -y ufw unattended-upgrades fail2ban curl gnupg debian-keyring debian-archive-keyring apt-transport-https

echo "== automatic security updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "== firewall: SSH, HTTP, HTTPS only"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "== fail2ban: blocks addresses that keep guessing SSH passwords"
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable fail2ban
systemctl restart fail2ban

echo "== Caddy (official repository)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "== site folders, owned by the deploy user"
mkdir -p /srv/sunsetsequence/site /srv/sunsetsequence/media
chown -R claude:claude /srv/sunsetsequence
mkdir -p /var/log/caddy && chown caddy:caddy /var/log/caddy
test -f /etc/caddy/auth.caddy || touch /etc/caddy/auth.caddy

echo "== done"
caddy version
ufw status | head -1
