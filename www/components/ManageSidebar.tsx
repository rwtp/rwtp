export default function ManageSidebar(page: string) {
  console.log(page);
  return (
    <div className="bg-gray-50 h-full">
      <div>
        <ul>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-4 bg-${
              page == 'account' ? 'white' : 'gray-50'
            }`}
          >
            <a href="/account">
              <div>Summary</div>
            </a>
          </li>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-4 bg-${
              page == 'purchases' ? 'white' : 'gray-50'
            }`}
          >
            <a href="/account/purchases">
              <div>Your Purchases</div>
            </a>
          </li>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-4 bg-${
              page == 'offers' ? 'white' : 'gray-50'
            }`}
          >
            <a href="/account/offers">
              <div>All Offers</div>
            </a>
          </li>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-4 bg-${
              page == 'listings' ? 'white' : 'gray-50'
            }`}
          >
            <a href="/account/listings">
              <div>Your Listings</div>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
