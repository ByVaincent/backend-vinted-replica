require("dotenv").config();

const stripe = require("stripe")(process.env.PAYMENT_SCRET_KEY);


const intent =  async (req, res) => {

  try {
     const intent = await stripe.paymentIntents.create({
      // To allow saving and retrieving payment methods, provide the Customer ID.
    //   customer: customer.id,
      amount: req.body.price,
      currency: 'usd',
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {enabled: true},
    });
    res.json({client_secret: intent.client_secret});
  } catch (error) {
    res.status(500).json({message: error.message})
  }
  
   
  };
  

  module.exports = {intent}