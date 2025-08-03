// Pricing data used by index.html and onboarding.html
const pricingData = {
    demonstration: {
        price: 'AU$149',
        setupFee: 'One-time payment'
    },
    showcase: {
        price: 'AU$399',
        setupFee: 'Covers 3 months of hosting, then AU$80/month if your campaign lasts longer'
    },
    enterprise: {
        price: 'Custom',
        setupFee: 'Contact for pricing'
    }
};

// Export for global use (satisfies linter)
if (typeof window !== 'undefined') {
    window.pricingData = pricingData;
}