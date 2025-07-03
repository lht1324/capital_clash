import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";

// Open checkout programmatically when needed
export async function openCheckout(
    userStakeAmount: number,
    onSuccess: () => void
) {
    const checkoutLink = `https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_1Sr5vElewGgDaekJTJH5P4EThLBH7i3wEwjvQ4XnJOa/redirect?amount=${userStakeAmount * 100}`;
    const theme = "light"; // or 'dark'

    try {
        // This creates the checkout iframe and returns a Promise
        // that resolves when the checkout is fully loaded
        // Now you can interact with the checkout instance
        const instance = await PolarEmbedCheckout.create(checkoutLink, theme);

        instance.addEventListener("success", (event) => {
            console.log("결제 성공", event)
            onSuccess();
        });

        return instance;
    } catch (error) {
        console.error("Failed to open checkout", error);
    }
};