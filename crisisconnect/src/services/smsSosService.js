/**
 * Offline SMS SOS Emergency Fallback Service
 * 
 * When cellular data (4G/5G) or Wi-Fi is severed during disasters,
 * this service formats a compact high-priority distress payload and
 * dispatches it over native SMS to the Disaster Control Room (112).
 */

export function generateSmsSosPayload({
  lat = 19.0760,
  lng = 72.8777,
  category = 'RESCUE',
  urgency = 'CRITICAL',
  peopleCount = 1,
  title = 'Distress Assistance',
  name = 'Citizen',
  phone = '',
}) {
  const cleanTitle = (title || 'SOS Distress').replace(/[#|;\n\r]/g, ' ').substring(0, 35);
  const cleanName = (name || 'Citizen').replace(/[#|;\n\r]/g, ' ').substring(0, 20);
  const cleanPhone = phone || '';
  return [
    'CRISISCONNECT',
    Number(lat).toFixed(5) + ',' + Number(lng).toFixed(5),
    category.toUpperCase(),
    urgency.toUpperCase(),
    peopleCount + 'P',
    cleanName,
    cleanPhone,
    cleanTitle,
  ].join('#');
}

export function openNativeSms({ recipient = '112', body }) {
  if (typeof window === 'undefined') return;
  const encodedBody = encodeURIComponent(body);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  const smsUrl = isIOS
    ? 'sms:' + recipient + '&body=' + encodedBody
    : 'sms:' + recipient + '?body=' + encodedBody;
  window.location.href = smsUrl;
}
