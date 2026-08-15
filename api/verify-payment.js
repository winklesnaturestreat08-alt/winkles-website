module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ verified: false });
  }

  const { reference, expectedAmount } = req.body || {};

  if (
    !reference ||
    !Number.isFinite(Number(expectedAmount)) ||
    Number(expectedAmount) <= 0
  ) {
    return res.status(400).json({ verified: false });
  }

  const key = process.env.PAYSTACK_SECRET_KEY;

  if (!key) {
    return res.status(500).json({
      verified: false,
      message: 'Verification not configured'
    });
  }

  try {
    const response = await fetch(
      'https://api.paystack.co/transaction/verify/' +
        encodeURIComponent(reference),
      {
        headers: {
          Authorization: 'Bearer ' + key
        }
      }
    );

    const data = await response.json();
    const expectedKobo = Math.round(Number(expectedAmount) * 100);

    const verified =
      response.ok &&
      data.status === true &&
      data.data &&
      data.data.status === 'success' &&
      data.data.currency === 'NGN' &&
      Number(data.data.amount) === expectedKobo;

    if (!verified) {
      return res.status(400).json({ verified: false });
    }

    return res.status(200).json({
      verified: true,
      reference: data.data.reference,
      amount: Number(data.data.amount) / 100,
      currency: data.data.currency
    });
  } catch (error) {
    return res.status(500).json({ verified: false });
  }
};
