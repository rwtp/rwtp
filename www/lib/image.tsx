export function getPrimaryImageLink(props: any) {
  let imageSrc = '/rwtp.png';
  if (props.primaryImage && props.primaryImage.length > 0) {
    if (
      props.primaryImage.startsWith('https://') ||
      props.primaryImage.startsWith('http://')
    ) {
      imageSrc = props.primaryImage;
    } else if (props.primaryImage.startsWith('ipfs://')) {
      const imageUri = props.primaryImage.replace(
        'ipfs://',
        'https://ipfs.infura.io/ipfs/'
      );
      imageSrc = imageUri;
    }
  }
  return imageSrc;
}
