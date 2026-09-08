import "./globals.css";

export const metadata = {
  title: "HEC Calendar",
  description: "Exam, event and sports calendar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
