export interface EmailSignaturePerson {
  slug: 'nelia-novare' | 'julia-berg';
  name: string;
  role: string;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
}

export const EMAIL_SIGNATURE_PEOPLE: EmailSignaturePerson[] = [
  {
    slug: 'nelia-novare',
    name: 'Nelia Novare',
    role: 'Real Estate Expert',
    phoneDisplay: '+372 5555 4722',
    phoneHref: '+37255554722',
    email: 'nelia@estoria.estate',
  },
  {
    slug: 'julia-berg',
    name: 'Julia Berg',
    role: 'Real Estate Expert',
    phoneDisplay: '+372 5870 8330',
    phoneHref: '+37258708330',
    email: 'julia@estoria.estate',
  },
];

export const SIGNATURE_LOGO_URL =
  'https://estoria.estate/email-signature-logo.png';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

export function buildSignatureHtml(
  person: EmailSignaturePerson,
  logoUrl = SIGNATURE_LOGO_URL,
) {
  const name = escapeHtml(person.name);
  const role = escapeHtml(person.role);
  const phoneDisplay = escapeHtml(person.phoneDisplay);
  const phoneHref = escapeHtml(person.phoneHref);
  const email = escapeHtml(person.email);
  const logo = escapeHtml(logoUrl);

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#222222;">
  <tr>
    <td style="padding:0 20px 0 0;vertical-align:middle;">
      <a href="https://estoria.estate" style="text-decoration:none;">
        <img src="${logo}" width="78" height="78" alt="Estoria" border="0" style="display:block;width:78px;height:78px;border:0;outline:none;text-decoration:none;">
      </a>
    </td>
    <td style="padding:0 0 0 20px;border-left:2px solid #b89445;vertical-align:middle;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:0;font-size:19px;line-height:24px;font-weight:bold;color:#222222;">${name}</td>
        </tr>
        <tr>
          <td style="padding:1px 0 7px 0;font-size:11px;line-height:18px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#a17d31;">${role}</td>
        </tr>
        <tr>
          <td style="padding:0;font-size:12px;line-height:19px;color:#555555;">
            <a href="tel:${phoneHref}" style="color:#555555;text-decoration:none;">${phoneDisplay}</a>
            <span style="color:#b89445;">&nbsp;|&nbsp;</span>
            <a href="mailto:${email}" style="color:#555555;text-decoration:none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0;font-size:12px;line-height:19px;color:#555555;">
            <a href="https://estoria.estate" style="color:#555555;text-decoration:none;">estoria.estate</a>
            <span style="color:#b89445;">&nbsp;|&nbsp;</span>
            Tallinn, Estonia
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function buildSignatureText(person: EmailSignaturePerson) {
  return [
    person.name,
    person.role,
    `${person.phoneDisplay} | ${person.email}`,
    'https://estoria.estate | Tallinn, Estonia',
  ].join('\n');
}

export function buildStandaloneSignatureDocument(
  person: EmailSignaturePerson,
) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(person.name)} - Estoria email signature</title>
</head>
<body style="margin:24px;background:#ffffff;">
${buildSignatureHtml(person)}
</body>
</html>`;
}
