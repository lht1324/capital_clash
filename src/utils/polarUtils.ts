import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";

// Open checkout programmatically when needed
export async function openCheckout() {
    const checkoutLink = "https://capital-clash.vercel.app/?checkout_id=c04b0930-dd49-4d29-818f-4668c23cd228";
    const theme = "light"; // or 'dark'

    try {
        // This creates the checkout iframe and returns a Promise
        // that resolves when the checkout is fully loaded
        const checkout = await PolarEmbedCheckout.create(checkoutLink, theme);

        // Now you can interact with the checkout instance
        return checkout;
    } catch (error) {
        console.error("Failed to open checkout", error);
    }
};