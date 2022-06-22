export default function ManageSidebar(page: string) {
  return (
    <div className="bg-gray-100 h-full w-48">
      <div>
        <ul>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-8 bg-${
              page == 'account' ? 'white' : 'gray-100'
            }`}
          >
            <a href="/account">
              <div>Summary</div>
            </a>
          </li>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-8 bg-${
              page == 'purchases' ? 'white' : 'gray-100'
            }`}
          >
            <a href="/account/purchases">
              <div>Your Purchases</div>
            </a>
          </li>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-8 bg-${
              page == 'offers' ? 'white' : 'gray-100'
            }`}
          >
            <a href="/account/offers">
              <div>All Offers</div>
            </a>
          </li>
          <li
            className={`w-full hover:opacity-50 whitespace-nowrap py-2 px-8 bg-${
              page == 'listings' ? 'white' : 'gray-100'
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
