# Security Policy

## Supported versions

Security fixes are provided for the latest published StudySeat SG release when
the project is actively maintained. Older versions and development snapshots
may not receive fixes. Users should update to the latest release before
reporting a problem that may already be resolved.

## Report a vulnerability privately

Do not open a public GitHub issue for a suspected vulnerability or include NLB
account identifiers, booking references, cookies, authentication data, raw
account responses, or personal screenshots in a public report.

Preferred private reporting channel:

- [Report a vulnerability through GitHub Security Advisories](https://github.com/teamcmcbot/nlb-seat-booking-extension/security/advisories/new)

If that form is unavailable, open a public
[GitHub issue](https://github.com/teamcmcbot/nlb-seat-booking-extension/issues)
asking the maintainers to provide a private reporting channel. Do not describe
the vulnerability or include credentials, cookies, account information, or
other sensitive details in that issue.

Include, where safe and relevant:

- the installed extension version and installation source;
- Chrome version and operating system;
- the affected NLB Seat Booking route and whether the session was signed in;
- a clear description of impact and reproducible steps using your own account;
- the smallest sanitised proof of concept needed to demonstrate the issue;
- whether the issue is known to be actively exploited; and
- a way to contact you for coordinated follow-up.

The maintainers will make a reasonable effort to acknowledge, investigate,
remediate, and coordinate disclosure, but cannot promise a response or fix
within a particular time.

## Appropriate security reports

Examples include:

- exposure or persistence of credentials, cookies, complete NLB account IDs,
  or booking references by extension code;
- cross-account leakage of favourites or local profile information;
- an extension action that can book or cancel without the required user
  confirmation;
- script injection or unsafe execution of remote data;
- permissions or site access broader than the disclosed purpose;
- deletion controls removing data outside the extension's owned keys; or
- a supply-chain or packaging issue affecting the published extension.

Ordinary NLB API changes, incorrect availability, layout problems, and other
non-sensitive defects should use the public bug-report template after all
personal data has been removed.

## Research boundaries

This policy covers the StudySeat SG source code and release packages. It does
not grant permission to test NLB, Google, GitHub, a library network, another
person's account, or any third-party system.

When investigating StudySeat SG:

- use only accounts, sessions, devices, bookings, and data you are authorised
  to use;
- do not access, retain, or disclose another person's information;
- do not bypass authentication, CAPTCHA, quotas, rate limits, geofencing, or
  access controls;
- do not perform denial-of-service, load, social-engineering, physical, or
  destructive testing;
- do not create or cancel real bookings solely for testing without the account
  holder's explicit approval; and
- stop if testing may affect NLB, another user, or production data.

If an issue appears to be in NLB rather than StudySeat SG, stop testing and use
NLB's official security or support process. The StudySeat SG maintainers cannot
authorise testing of NLB systems.

## Disclosure

Please allow a reasonable opportunity to investigate and release a fix before
publishing technical details that could put users at risk. The maintainers may
credit reporters who request credit and may publish a GitHub security advisory
when a vulnerability affects released versions.
