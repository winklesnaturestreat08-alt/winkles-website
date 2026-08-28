module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      verified: false,
      message: 'Method not allowed'
    });
  }

  let body = req.body;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return res.status(400).json({
        verified: false,
        message: 'Invalid request'
      });
    }
  }

  const { reference } = body || {};

  if (!reference) {
    return res.status(400).json({
      verified: false,
      message: 'Payment reference missing'
    });
  }

  const key = process.env.PAYSTACK_SECRET_KEY;

  if (!key) {
    return res.status(500).json({
      verified: false,
      message: 'Payment verification is not configured'
    });
  }

  try {
    const response = await fetch(
      'https://api.paystack.co/transaction/verify/' +
        encodeURIComponent(reference),
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + key
        }
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      data.status !== true ||
      !data.data ||
      data.data.status !== 'success' ||
      data.data.currency !== 'NGN'
    ) {
      return res.status(400).json({
        verified: false,
        message: 'Payment could not be verified'
      });
    }

    return res.status(200).json({
      verified: true,
      reference: data.data.reference,
      amount: Number(data.data.amount) / 100,
      currency: data.data.currency
    });
  } catch (error) {
    return res.status(500).json({
      verified: false,
      message: 'Payment verification service error'
    });
  }
};
