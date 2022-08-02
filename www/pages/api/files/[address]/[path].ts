import { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';

function svg(props: {
  supply: number;
  redeemDate: Date;
  title: string;
  image: string;
}) {
  const date = dayjs(props.redeemDate).format('YYYY-MM-DD');

  // An svg with a 5/4 ratio image, a title, a date underneath,
  // and a black square in the bottom right corner with a monospaced
  // font in white that displays a number.
  return `<?xml version="1.0"?>
  <svg fill="current-color" xmlns="http://www.w3.org/2000/svg"   width="600px" height="600px">    

    <defs>
      <pattern id="dots" x="0" y="0" width=".01" height=".01">
        <circle cx="4" cy="4" r="1" fill="black" fill-opacity='0.95' />
      </pattern>
    </defs>

    <style>
      .supply { 
          font: 16px monospace;
          fill: white;

      }
      .title {
        font: 24px serif; 
      }
      .date {
        font: 16px monospace; 
        color: #313131;
      }
    </style>
    

    <image href="${props.image}" x="0px" y="0px" height="480px" width="600px" />
      

    <!-- Left label -->
    <svg  width="480px" height="120px" x="0px" y="480px" >
    <rect fill="white"  width="100%" height="100%" />
    <text class="title" x="24px" y="40%" dominant-baseline="middle" >${props.title}</text>
    <text class="date" x="24px" y="65%" dominant-baseline="middle">Redeemable on ${date}</text>
    </svg>

    <!-- Square label -->
    <svg  width="120px" height="120px" x="480px" y="480px" >
    <rect fill="black"  width="100%" height="100%" />
    <text  class="supply" text-anchor="middle"  x="50%" y="50%" dominant-baseline="middle" >${props.supply}</text>
    </svg>


    <!-- border -->
    <rect fill="black"  width="600px" height="2px" x="0px" y="480px" />

    <!-- outlines -->
    <rect fill="black"  width="600px" height="2px" x="0px" y="598px" />
    <rect fill="black"  width="600px" height="2px" x="0px" y="0px" />
    <rect fill="black"  width="2px" height="600px" x="0px" y="0px" />
    <rect fill="black"  width="2px" height="600px" x="598px" y="0px" />

  </svg>
`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).write(
    svg({
      supply: 1000,
      redeemDate: dayjs('2021-12-31').toDate(),
      title: 'Ridge Wallet',
      image: '/ridge.png',
    })
  );

  res.end();
}
