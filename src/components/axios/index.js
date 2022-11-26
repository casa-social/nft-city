import axios from 'axios'
import env from 'react-dotenv';

let APIkit = axios.create({
    headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "X-Requested-With",
        'Access-Control-Allow-Headers': 'Content-Type'
      },
    timeout: 10000,
});

export default APIkit