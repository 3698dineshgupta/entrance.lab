export default function TermsPage() {
  return (
    <div className="container py-24 max-w-3xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-invert max-w-none text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing or using EntranceLab, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you do not have permission to access the service.</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">2. Use of the Platform</h2>
        <p>EntranceLab provides mock tests and preparation materials for IOE and CEE entrance exams. You may use our service only for lawful purposes and in accordance with these Terms.</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>You must not share your account credentials with anyone else.</li>
          <li>You must not attempt to scrape, copy, or distribute our test materials.</li>
          <li>We reserve the right to terminate accounts that violate these rules.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">3. Intellectual Property</h2>
        <p>The content, features, and functionality of the service are and will remain the exclusive property of EntranceLab and its licensors. Our materials are protected by copyright and intellectual property laws.</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">4. Disclaimer of Warranties</h2>
        <p>The service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the service will be uninterrupted, error-free, or completely secure. Our mock tests are for preparation purposes only and do not guarantee actual exam results.</p>
      </div>
    </div>
  );
}
