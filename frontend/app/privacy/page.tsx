"use client";

import { Navbar } from "@/components/navbar";

export default function PrivacyPolicy() {
  return (
    <main className="flex flex-col min-h-dvh">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            <strong>Last Updated:</strong> October 5, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Metascience Platform (&quot;we&quot;, &quot;our&quot;, or
              &quot;us&quot;) is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our Service.
            </p>
            <p className="mt-4">
              <strong>Key Points:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                We collect minimal personal information (email and password for
                authentication)
              </li>
              <li>
                We do NOT sell, rent, or share your personal data with third
                parties
              </li>
              <li>
                We use Supabase for secure data storage and authentication
              </li>
              <li>
                You have full control over your data and can request deletion at
                any time
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              2.1 Information You Provide
            </h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Email Address:</strong> Used for account creation,
                authentication, and password recovery
              </li>
              <li>
                <strong>Password:</strong> Securely hashed and stored by
                Supabase Auth (we never store plain-text passwords)
              </li>
              <li>
                <strong>User ID:</strong> Automatically generated unique
                identifier for your account
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Usage Data</h3>
            <p>
              We collect information about how you interact with the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Search queries:</strong> DOIs and search terms you enter
                (stored temporarily for analysis)
              </li>
              <li>
                <strong>Feedback:</strong> Ratings (1-5 stars), feedback type,
                and messages you submit
              </li>
              <li>
                <strong>Tab interactions:</strong> Which features you use
                (search, analysis, review, citation)
              </li>
              <li>
                <strong>Timestamps:</strong> When you create or update feedback
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              2.3 Automatically Collected Information
            </h3>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Session Cookies:</strong> Authentication tokens to keep
                you logged in
              </li>
              <li>
                <strong>Browser Information:</strong> Standard browser data sent
                with HTTP requests
              </li>
              <li>
                <strong>IP Address:</strong> May be logged by our hosting
                provider for security purposes
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              2.4 Information We Do NOT Collect
            </h3>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                We do NOT collect your name, address, phone number, or other
                identifying information
              </li>
              <li>We do NOT use tracking pixels or advertising cookies</li>
              <li>
                We do NOT collect payment information (the service is free)
              </li>
              <li>
                We do NOT track your browsing activity outside our Service
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <p>We use the collected information for the following purposes:</p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              3.1 Service Provision
            </h3>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Creating and managing your user account</li>
              <li>Authenticating you when you log in</li>
              <li>Providing citation network analysis and visualization</li>
              <li>Saving your search history and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              3.2 Service Improvement
            </h3>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                Analyzing feedback to improve features and user experience
              </li>
              <li>Identifying and fixing bugs or technical issues</li>
              <li>Understanding which features are most valuable to users</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              3.3 Communication
            </h3>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Sending password reset emails when requested</li>
              <li>
                Notifying you of important service updates or security issues
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              3.4 Security and Legal Compliance
            </h3>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Detecting and preventing fraud or abuse</li>
              <li>Protecting against security threats</li>
              <li>Complying with legal obligations if required</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. How We Store Your Information
            </h2>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.1 Supabase Infrastructure
            </h3>
            <p>
              All user data is stored securely using Supabase, a PostgreSQL
              database service with:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Encryption:</strong> Data is encrypted in transit
                (TLS/SSL) and at rest
              </li>
              <li>
                <strong>Authentication:</strong> Industry-standard
                authentication with bcrypt password hashing
              </li>
              <li>
                <strong>Row-Level Security:</strong> Database policies ensure
                users can only access their own data
              </li>
              <li>
                <strong>Regular Backups:</strong> Automatic backups to prevent
                data loss
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.2 Data Location
            </h3>
            <p>
              Your data is stored on Supabase&apos;s secure servers. For
              information about Supabase&apos;s data centers and security
              practices, please refer to{" "}
              <a
                href="https://supabase.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Supabase&apos;s Security Documentation
              </a>
              .
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.3 Data Retention
            </h3>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Account Data:</strong> Retained while your account is
                active
              </li>
              <li>
                <strong>Feedback Data:</strong> Retained indefinitely unless you
                request deletion
              </li>
              <li>
                <strong>Session Data:</strong> Automatically expires after
                logout or session timeout
              </li>
              <li>
                <strong>Deleted Accounts:</strong> Personal data is permanently
                deleted within 30 days of account deletion request
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Data Sharing and Disclosure
            </h2>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              5.1 We Do NOT Sell or Share Your Data
            </h3>
            <p>
              <strong>
                We do NOT sell, rent, or share your personal information with
                third parties for marketing or commercial purposes.
              </strong>
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              5.2 Service Providers
            </h3>
            <p>We use the following trusted service providers:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Supabase:</strong> Database and authentication services.
                Supabase has access to your data only for the purpose of
                providing infrastructure services.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              5.3 Academic APIs
            </h3>
            <p>
              When you perform searches, we query the following APIs with your
              search terms:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Semantic Scholar API:</strong> To retrieve citation and
                paper data
              </li>
              <li>
                <strong>OpenAlex API:</strong> To retrieve scholarly metadata
              </li>
              <li>
                <strong>OpenCitations API:</strong> To retrieve citation
                relationships
              </li>
            </ul>
            <p className="mt-2">
              These queries contain only the DOIs or search terms you provide,
              NOT your personal information. Each API has its own privacy policy
              and terms of service.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              5.4 Legal Requirements
            </h3>
            <p>
              We may disclose your information if required to do so by law or in
              response to valid requests by public authorities (e.g., court
              orders, subpoenas).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Cookies and Tracking
            </h2>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              6.1 Essential Cookies
            </h3>
            <p>We use essential cookies for:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Authentication:</strong> Session cookies to keep you
                logged in
              </li>
              <li>
                <strong>Security:</strong> CSRF protection tokens
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              6.2 No Advertising or Analytics Cookies
            </h3>
            <p>We do NOT use:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Google Analytics or other third-party analytics</li>
              <li>Advertising cookies or tracking pixels</li>
              <li>Social media tracking widgets</li>
              <li>Cross-site tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Your Privacy Rights
            </h2>
            <p>You have the following rights regarding your personal data:</p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.1 Access</h3>
            <p>
              You can access your account information at any time through your
              profile page.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.2 Correction</h3>
            <p>
              You can update your email address through your profile settings or
              by requesting a password reset to verify access.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.3 Deletion</h3>
            <p>
              You have the right to request deletion of your account and all
              associated personal data. To delete your account, use the feedback
              form to submit a deletion request, and we will process it within
              30 days.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              7.4 Data Portability
            </h3>
            <p>
              You can request a copy of your data (feedback submissions, account
              information) by contacting us through the feedback form.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.5 Opt-Out</h3>
            <p>
              You can opt out of receiving non-essential emails. Note that we
              may still send security-related or account-critical notifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not intended for children under the age of 13. We
              do not knowingly collect personal information from children under
              13. If you become aware that a child has provided us with personal
              information, please contact us, and we will take steps to delete
              such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and maintained on servers
              located outside of your state, province, country, or other
              governmental jurisdiction where data protection laws may differ.
              By using the Service, you consent to such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Security Measures
            </h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Encryption:</strong> TLS/SSL for data in transit,
                encryption at rest
              </li>
              <li>
                <strong>Password Hashing:</strong> Bcrypt algorithm for secure
                password storage
              </li>
              <li>
                <strong>Row-Level Security:</strong> Database policies to
                prevent unauthorized access
              </li>
              <li>
                <strong>Authentication Tokens:</strong> Secure session
                management
              </li>
              <li>
                <strong>Regular Updates:</strong> Security patches and
                dependency updates
              </li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet is 100%
              secure. While we strive to protect your personal information, we
              cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Third-Party Links
            </h2>
            <p>
              Our Service may contain links to third-party websites (e.g.,
              academic papers, databases). We are not responsible for the
              privacy practices of these external sites. We encourage you to
              review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                Updating the &quot;Last Updated&quot; date at the top of this
                page
              </li>
              <li>
                Posting a notice in the application (for material changes)
              </li>
            </ul>
            <p className="mt-4">
              We encourage you to review this Privacy Policy periodically. Your
              continued use of the Service after changes are posted constitutes
              your acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              13. GDPR Compliance (European Users)
            </h2>
            <p>
              If you are located in the European Economic Area (EEA), you have
              additional rights under the General Data Protection Regulation
              (GDPR):
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Legal Basis:</strong> We process your data based on your
                consent and our legitimate interest in providing the Service
              </li>
              <li>
                <strong>Data Protection Officer:</strong> Contact us through the
                feedback form for data protection inquiries
              </li>
              <li>
                <strong>Right to Object:</strong> You can object to processing
                of your data
              </li>
              <li>
                <strong>Right to Lodge a Complaint:</strong> You can file a
                complaint with your local data protection authority
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              14. California Privacy Rights (CCPA)
            </h2>
            <p>
              If you are a California resident, you have specific rights under
              the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Right to Know:</strong> What personal information we
                collect and how it&apos;s used
              </li>
              <li>
                <strong>Right to Delete:</strong> Request deletion of your
                personal information
              </li>
              <li>
                <strong>Right to Opt-Out:</strong> We do NOT sell personal
                information
              </li>
              <li>
                <strong>Non-Discrimination:</strong> We will not discriminate
                against you for exercising your rights
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              15. Data Breach Notification
            </h2>
            <p>
              In the event of a data breach that affects your personal
              information, we will notify you via email within 72 hours of
              becoming aware of the breach, as required by applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this
              Privacy Policy or your personal data, please contact us using the
              feedback form available in the application. We will respond to all
              legitimate requests within 30 days.
            </p>
          </section>

          <section className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
              Summary: Your Privacy at a Glance
            </h3>
            <ul className="space-y-2 text-blue-800 dark:text-blue-200">
              <li>✓ We collect only essential information (email, password)</li>
              <li>✓ We do NOT sell or share your personal data</li>
              <li>✓ All data is encrypted and securely stored in Supabase</li>
              <li>✓ You can delete your account and data at any time</li>
              <li>✓ We use no advertising or tracking cookies</li>
              <li>✓ You have full control over your information</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
