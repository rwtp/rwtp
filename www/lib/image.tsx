import { ipfsFetchableUrl } from './ipfs';

export function getPrimaryImageLink(props: any) {
  let imageSrc = '/rwtp.png';
  if (props.primaryImage && props.primaryImage.length > 0) {
    if (
      props.primaryImage.startsWith('https://') ||
      props.primaryImage.startsWith('http://') ||
      props.primaryImage.startsWith('ipfs://')
    ) {
      imageSrc = ipfsFetchableUrl(props.primaryImage);
    }
  }
  return imageSrc;
}
