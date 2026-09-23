# Dynamics 365 Sales pricing tool

Static, dependency-free estimator for current US Dynamics 365 Sales list pricing, qualifying attach pricing, and included Copilot Credits.

**Live site:** https://tommylthai.github.io/dynamics-sales-pricing-tool/

## Local preview

From the repository root:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000/.

## Pricing basis

Pricing was last verified **September 23, 2026**. The estimator uses USD list prices shown by Microsoft for annual commitments billed at the published monthly equivalent:

| License | Official price used | Included Copilot Credits |
| --- | ---: | ---: |
| Dynamics 365 Sales Professional | $65/user/month | Not included; sold separately |
| Dynamics 365 Sales Enterprise | $105/user/month | Not included; sold separately |
| Dynamics 365 Sales Premium | $150/user/month | 1,000/user/month |
| Microsoft Relationship Sales | Variable; 10-seat minimum | None documented separately |
| Sales Enterprise attach for qualifying Business Central Premium users | $20/user/month | No additional platform entitlement |

The attach scenario is intentionally narrow. Microsoft's September 2026 licensing guide explicitly documents Sales Enterprise at $20/user/month, billed annually, as an exception for a user whose qualifying base license is Business Central Premium. The calculator requires confirmation of that prerequisite and does not infer eligibility for other base licenses.

## Official sources

- [Dynamics 365 Sales pricing](https://www.microsoft.com/en-us/dynamics-365/products/sales/pricing)
- [Dynamics 365 Licensing Guide, September 2026](https://go.microsoft.com/fwlink/?LinkId=866544)
- [Dynamics 365 Sales licenses and storage FAQ](https://learn.microsoft.com/en-us/dynamics365/sales/faq-licenses-storage)
- [Copilot Credits Guide, September 2026](https://go.microsoft.com/fwlink/?linkid=2368800)
- [Microsoft Product Terms for Dynamics 365](https://www.microsoft.com/licensing/terms/productoffering/MicrosoftDynamics365/ALL)

## Validation

Run the dependency-free calculation tests with:

```powershell
node tests/calculations.test.mjs
```

This tool is an informational, non-binding estimate. It is not a quote, licensing statement, or substitute for Microsoft Product Terms. Actual pricing, taxes, promotions, agreement discounts, regional availability, billing terms, and eligibility can differ. Confirm purchases with Microsoft or an authorized partner.
