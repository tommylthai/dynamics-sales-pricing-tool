# Dynamics 365 Sales pricing tool

Static, dependency-free estimator for current US Dynamics 365 Sales list pricing, qualifying attach pricing, included Copilot Credits, and included Dataverse capacity.

**Live site:** https://tommylthai.github.io/dynamics-sales-pricing-tool/

## Local preview

From the repository root:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000/.

## Pricing basis

Pricing and licensing sources were last verified **September 23, 2026**. The estimator uses USD list prices shown by Microsoft for annual commitments billed at the published monthly equivalent:

| License | Official price used | Included Copilot Credits |
| --- | ---: | ---: |
| Dynamics 365 Sales Professional | $65/user/month | Not included; sold separately |
| Dynamics 365 Sales Enterprise | $105/user/month | Not included; sold separately |
| Dynamics 365 Sales Premium | $150/user/month | 1,000/user/month |
| Microsoft Relationship Sales | Variable; 10-seat minimum | None documented separately |
| Sales Enterprise attach for qualifying Business Central Premium users | $20/user/month | No additional platform entitlement |

The attach scenario is intentionally narrow. Microsoft's September 2026 licensing guide explicitly documents Sales Enterprise at $20/user/month, billed annually, as an exception for a user whose qualifying base license is Business Central Premium. The calculator requires confirmation of that prerequisite and does not infer eligibility for other base licenses.

## Dataverse capacity basis

The September 2026 Dynamics 365 Licensing Guide documents the following included Dataverse capacity for the Sales licenses represented by this tool:

| License | One-time tenant default | Increment per user license |
| --- | --- | --- |
| Sales Professional | 30 GB database, 40 GB file, 2 GB log | No per-user accrual documented |
| Sales Enterprise | 30 GB database, 40 GB file, 2 GB log | 250 MB database, 2 GB file, no log accrual |
| Sales Premium | 45 GB database, 60 GB file, 2 GB log | 500 MB database, 2 GB file, no log accrual |
| Microsoft Relationship Sales | Sales Enterprise entitlement because Enterprise is the bundled core application | 250 MB database, 2 GB file, no log accrual |
| Sales Enterprise attach | No additional capacity entitlement | No additional capacity entitlement |

The tenant default is included once with the first qualifying Dynamics 365 base subscription; it is not multiplied by user count and is not cumulative across additional base or attach licenses. For mixed new-license estimates, the site's automatic option uses the largest selected documented Sales default and identifies that assumption. Select the actual qualifying first subscription when known. Existing tenants should normally exclude the default from the estimate and verify current entitlement, purchased add-ons, consumption, and environment allocation in the Power Platform admin center.

## Official sources

- [Dynamics 365 Sales pricing](https://www.microsoft.com/en-us/dynamics-365/products/sales/pricing)
- [Dynamics 365 Licensing Guide, September 2026](https://go.microsoft.com/fwlink/?LinkId=866544)
- [Power Platform Licensing Guide, September 2026](https://go.microsoft.com/fwlink/p/?linkid=2085130)
- [Dataverse capacity-based storage details](https://learn.microsoft.com/en-us/power-platform/admin/capacity-storage)
- [Dynamics 365 Sales licenses and storage FAQ](https://learn.microsoft.com/en-us/dynamics365/sales/faq-licenses-storage)
- [Copilot Credits Guide, September 2026](https://go.microsoft.com/fwlink/?linkid=2368800)
- [Microsoft Product Terms for Dynamics 365](https://www.microsoft.com/licensing/terms/productoffering/MicrosoftDynamics365/ALL)

## Validation

Run the dependency-free calculation tests with:

```powershell
node tests/calculations.test.mjs
```

This tool is an informational, non-binding estimate. It is not a quote, licensing statement, or substitute for Microsoft Product Terms. Actual pricing, taxes, promotions, agreement discounts, regional availability, billing terms, and eligibility can differ. Confirm purchases with Microsoft or an authorized partner.
