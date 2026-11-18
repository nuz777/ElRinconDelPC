export interface WindowsItem {
  id: string;
  title: string;
  img: string;
  size: string;
  desc: string;
  link: string;
  password?: string;
  minReq: string;
  recReq: string;
}

export const windowsItems: WindowsItem[] = [];
