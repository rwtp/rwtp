export default function ManageSidebar(props: { children: any }) {
  return (
    <div>
      <div>
        <ul>
          <li>
            <a href="/manage">
              <div>Summary</div>
            </a>
          </li>
          <li>
            <a href="/manage/purchases">
              <div>Your Purchases</div>
            </a>
          </li>
          <li>
            <div>Your Sales</div>
            <ul>
              <li>
                <a href="/manage/offers">
                  <div>All Offers</div>
                </a>
              </li>
              <li>
                <a href="/manage/offers/pending">
                  <div>Pending Offers</div>
                </a>
              </li>
              <li>
                <a href="/manage/offers/accepted">
                  <div>Accepted Offers</div>
                </a>
              </li>
            </ul>
          </li>
          <li>
            <a href="/manage/listings">
              <div>Your Listings</div>
            </a>
          </li>
        </ul>
      </div>
      {props.children}
    </div>
  );
}
