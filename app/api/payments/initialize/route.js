export async function POST(req) {
  try {

    // Get payment details from frontend
    const body = await req.json();

    // Send request to PayChangu
    const response = await fetch(
      "https://api.paychangu.com/payment",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY_MAIN}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          amount: body.amount,

          currency: "MWK",

          email: body.email,

          first_name: body.firstName,

          last_name: body.lastName,

          callback_url:
            "http://localhost:3000/payment/callback",

          return_url:
            "http://localhost:3000/payment/success",

          tx_ref: `TX-${Date.now()}`,

          customization: {
            title: "My Website",

            description: "Payment",
          },
        }),
      }
    );

    // Convert PayChangu response
    const data = await response.json();

    console.log(data);

    // Return response to frontend
    return Response.json(data);

  } catch (error) {

    console.log(error);

    return Response.json(
      {
        error: "Payment initialization failed",
      },
      {
        status: 500,
      }
    );
  }
}