export default function PrivacyPage() {
  return (
    <div className="container py-24 max-w-3xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, such as your name, email address, and any profile information you choose to add. We also collect performance data from the mock tests you attempt to provide you with personalized analytics.</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>Provide, maintain, and improve our services.</li>
          <li>Calculate and display your personal test analytics and progress.</li>
          <li>Send you technical notices, updates, and support messages.</li>
          <li>Protect against fraudulent or illegal activity.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">3. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the internet or electronic storage is 100% secure.</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">4. Sharing of Information</h2>
        <p>We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners and trusted affiliates.</p>
      </div>
    </div>
  );
}
