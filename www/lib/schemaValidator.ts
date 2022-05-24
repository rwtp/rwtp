export function is_valid_custom_schema(text: string) {
    try {
      let parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' ) { 
        return false;
      }
      return true;
    }
    catch (error) {
      return false;
    }
  }
  