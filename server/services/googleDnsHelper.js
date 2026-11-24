const dns = require('dns').promises;

const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '1.1.1.1']);
const resolvedGoogleIps = {};

const BOOTSTRAP_IPS = [
  '172.217.118.4',
  '172.217.116.4',
  '172.217.117.4',
  '172.217.114.4',
  '172.217.112.4',
  '142.250.204.42'
];

/**
 * Robust 3-tier DNS resolution for Google Cloud Code endpoints:
 * 1. Public DNS (8.8.8.8, 1.1.1.1) to bypass local hosts loopback
 * 2. DNS-over-HTTPS (DoH via dns.google) over port 443 (firewall-proof)
 * 3. Static bootstrap Google API Anycast IP pool (always available)
 */
async function resolveDirectHost(hostname) {
  if (hostname === 'cloudcode-pa.googleapis.com' || hostname === 'daily-cloudcode-pa.googleapis.com') {
    if (resolvedGoogleIps[hostname] && (Date.now() - resolvedGoogleIps[hostname].ts < 300000)) {
      return resolvedGoogleIps[hostname].ip;
    }

    // Tier 1: Public UDP DNS
    try {
      const ips = await dnsResolver.resolve4(hostname);
      if (ips && ips.length > 0 && !ips[0].startsWith('127.')) {
        resolvedGoogleIps[hostname] = { ip: ips[0], ts: Date.now() };
        return ips[0];
      }
    } catch (_) {}

    // Tier 2: DNS-over-HTTPS via dns.google
    try {
      const dohRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`, {
        signal: AbortSignal.timeout(3000)
      });
      if (dohRes.ok) {
        const dohData = await dohRes.json();
        if (Array.isArray(dohData.Answer) && dohData.Answer.length > 0) {
          const ip = dohData.Answer[0].data;
          if (ip && !ip.startsWith('127.')) {
            resolvedGoogleIps[hostname] = { ip, ts: Date.now() };
            return ip;
          }
        }
      }
    } catch (_) {}

    // Tier 3: Static Bootstrap Google API IPs
    const fallbackIp = BOOTSTRAP_IPS[Math.floor(Math.random() * BOOTSTRAP_IPS.length)];
    resolvedGoogleIps[hostname] = { ip: fallbackIp, ts: Date.now() };
    return fallbackIp;
  }
  return hostname;
}

function invalidateDnsCache(hostname) {
  if (hostname) {
    delete resolvedGoogleIps[hostname];
  } else {
    for (const k of Object.keys(resolvedGoogleIps)) {
      delete resolvedGoogleIps[k];
    }
  }
}

module.exports = {
  resolveDirectHost,
  invalidateDnsCache
};
