import "./globals.css";

export const metadata = {
  title: "Hostel Calendar | HEC | VIT Bhopal",
  description: "Hostel Calendar for HEC, VIT Bhopal",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
