/**
 * Default negotiation playbook used when no custom playbook is provided.
 * Based on standard commercial contract best practices.
 */
export const DEFAULT_PLAYBOOK = `
# Default Negotiation Playbook

## Organization Defaults
- Default Role: Customer/Buyer
- Risk Tolerance: Moderate
- Escalation: Items marked RED require senior counsel review

---

## Limitation of Liability

### Standard Position
- Cap Amount: 12 months of fees paid or payable
- Cap Structure: Aggregate per year
- Consequential Damages: Mutual exclusion required
- Carveouts from Cap: Indemnification, willful misconduct, confidentiality breach, IP infringement

### Acceptable Range (YELLOW)
- Cap as low as 6 months of fees
- Asymmetric carveouts acceptable if limited to specific high-risk items

### Escalation Triggers (RED)
- Cap below 6 months of fees
- No consequential damages exclusion for either party
- Uncapped liability for any material obligation
- Carveouts that effectively eliminate the cap (e.g., "any breach")

---

## Indemnification

### Standard Position
- Mutuality: Mutual indemnification required
- Scope: IP infringement, third-party claims, data breaches
- Cap: Subject to overall liability cap
- Procedure: 30-day notice, right to control defense

### Acceptable Range (YELLOW)
- Unilateral IP indemnification (if we don't contribute IP)
- Broader vendor indemnification if capped

### Escalation Triggers (RED)
- Uncapped indemnification
- Indemnification for "any breach" of agreement
- No right to participate in defense
- No notice requirements
- Survival beyond 3 years post-termination

---

## Intellectual Property

### Standard Position
- Pre-existing IP: Each party retains ownership
- Developed IP: Work product ownership depends on context
- License Scope: Limited to contract purpose
- Feedback: No automatic broad license grant

### Acceptable Range (YELLOW)
- Feedback clause with narrow scope (non-exclusive, improvements only)
- Work-for-hire for clearly defined deliverables only

### Escalation Triggers (RED)
- Assignment of our pre-existing IP
- Work-for-hire extending to methodologies/tools
- Perpetual, irrevocable, sublicensable license to our data
- No license back for improvements to our materials

---

## Data Protection

### Standard Position
- DPA Required: Yes, when processing personal data
- Breach Notification: 48-72 hours
- Sub-processors: Prior written notice, right to object
- Data Return/Deletion: Within 30 days of termination
- Cross-border Transfers: SCCs or equivalent required

### Acceptable Range (YELLOW)
- 72-hour breach notification (GDPR minimum)
- General authorization for sub-processors with maintained list

### Escalation Triggers (RED)
- No DPA when personal data is processed
- Breach notification > 72 hours or "reasonable time"
- No cross-border transfer protections
- No data deletion obligations
- Unlimited sub-processor authorization without notice

---

## Term and Termination

### Standard Position
- Initial Term: 1-3 years
- Renewal Notice: 90 days before renewal
- Termination for Convenience: 60-90 days notice
- Termination for Cause: 30 days cure period
- Transition Assistance: 60-90 days at then-current rates

### Acceptable Range (YELLOW)
- 60-day renewal notice
- No termination for convenience if pricing reflects commitment
- 15-day cure period for payment defaults

### Escalation Triggers (RED)
- Auto-renewal with < 30-day notice window
- No termination for convenience on multi-year deal
- No cure period for curable breaches
- No transition assistance provisions
- Initial term > 5 years without exit ramps

---

## Governing Law and Dispute Resolution

### Standard Position
- Governing Law: Delaware, New York, or our home state
- Venue: Mutual jurisdiction or neutral location
- Dispute Resolution: Litigation preferred; arbitration acceptable with neutral rules
- Escalation: 30-day good-faith negotiation before formal proceedings

### Acceptable Range (YELLOW)
- Major US jurisdictions (CA, TX, IL)
- AAA or JAMS arbitration with neutral venue

### Escalation Triggers (RED)
- Foreign governing law without nexus
- Mandatory arbitration with drafter-favorable rules
- Venue requiring international travel
- Class action waiver (if we might be class member)
- No escalation process before litigation

---

## Confidentiality

### Standard Position
- Definition: Reasonable and specific
- Exclusions: Standard (public, prior knowledge, independent development, legal compulsion)
- Term: 3-5 years from disclosure
- Return/Destruction: Upon termination or request

### Acceptable Range (YELLOW)
- Perpetual for trade secrets only
- 2-year term for non-sensitive information

### Escalation Triggers (RED)
- Perpetual confidentiality for all information
- Missing standard exclusions
- No return/destruction obligation
- Unilateral obligations only

---

## Insurance

### Standard Position
- Commercial General Liability: $2M per occurrence
- Professional Liability / E&O: $2M per claim
- Cyber Liability: $5M (if handling our data)

### Acceptable Range (YELLOW)
- Lower limits for low-value contracts
- Cyber liability waivable for non-data contracts

### Escalation Triggers (RED)
- No insurance requirements for critical vendors
- Limits below $1M for significant engagements
`;
