import tokenlist from '@eth-optimism/tokenlist';

const acceptedCoins = [
  'USDC',
  'WETH',
  'USDT',
  'WBTC',
  'DAI',
  'LINK',
  'UST',
  'FRAX',
];

export function renderToken(props, option, snapshot, className) {
  const imgStyle = {
    marginRight: 10,
    verticalAlign: 'middle',
  };

  if (option.value === 'Custom') {
    return (
      <button {...props} className={className} type="button">
        <u className="text-sky-600">{option.name}</u>
      </button>
    );
  } else {
    return (
      <button {...props} className={className} type="button">
        <div className="flex flex-row">
          <div className="self-center">
            <img
              alt=""
              style={imgStyle}
              width="16"
              height="16"
              src={option.logo}
            />
          </div>
          <div>{option.name}</div>
        </div>
      </button>
    );
  }
}

export function dropDownUI(classes: string) {
  if (classes === 'input') {
    return 'px-4 py-2 border rounded-l';
  } else if (classes === 'option') {
    return 'px-4 py-2 w-full hover:bg-slate-100';
  } else if (classes === 'options') {
    return 'border absolute bg-white drop-shadow-lg';
  } else {
    return classes;
  }
}

export const optimismList = tokenlist.tokens
  .filter(
    (token) => acceptedCoins.includes(token.symbol) && token.chainId == 10
  )
  .map((row) => {
    return { value: row.address, name: row.symbol, logo: row.logoURI };
  })
  .concat([{ value: 'Custom', name: 'Custom Token', logo: '' }]);

// export default function Page() {
//   console.log(optimismList);

//   // https://github.com/tbleckert/react-select-search/blob/main/style.css
//   return (
//     <div className="px-4 py-4 max-w-2xl mx-auto max-h-1">
//       <SelectSearch
//         className={(classes: string) => {
//           return dropDownUI(classes);
//         }}
//         options={optimismList}
//         placeholder="USDC"
//         onChange={(opt) => {
//           if (opt === 'Custom') {
//             console.log("It's custom innit");
//           } else {
//             console.log(opt);
//           }
//         }}
//         search
//         renderOption={renderToken}
//       />
//     </div>
//   );
// }
