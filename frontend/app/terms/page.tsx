"use client";

import { Navbar } from "@/components/navbar";

export default function TermsOfService() {
  return (
    <main className="flex flex-col min-h-dvh">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            <strong>Last Updated:</strong> October 5, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using the Metascience Platform
              (&quot;Service&quot;, &quot;Platform&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;), you accept and agree to be
              bound by the terms and provisions of this agreement. If you do not
              agree to these Terms of Service, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p>The Metascience Platform is a research tool that provides:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Citation network visualization and analysis</li>
              <li>Academic paper search and discovery</li>
              <li>Research literature review assistance</li>
              <li>
                Integration with academic databases (Semantic Scholar, OpenAlex,
                OpenCitations)
              </li>
            </ul>
            <p>
              The Service is provided free of charge and is intended for
              academic and research purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">
              3.1 Registration
            </h3>
            <p>
              To access certain features, you must create an account by
              providing a valid email address and password. You are responsible
              for maintaining the confidentiality of your account credentials.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              3.2 Account Security
            </h3>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password and account</li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
              <li>
                Be responsible for all activities that occur under your account
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              3.3 Account Termination
            </h3>
            <p>
              We reserve the right to suspend or terminate your account at any
              time for violations of these Terms of Service or for any other
              reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.1 Permitted Use
            </h3>
            <p>
              You may use the Service for legitimate academic research,
              literature review, and educational purposes.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.2 Prohibited Activities
            </h3>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                Use the Service for any illegal purpose or in violation of any
                local, state, national, or international law
              </li>
              <li>
                Violate or infringe upon the intellectual property rights of
                others
              </li>
              <li>
                Attempt to gain unauthorized access to the Service or its
                related systems
              </li>
              <li>
                Engage in any activity that could damage, disable, or impair the
                Service
              </li>
              <li>
                Use automated scripts, bots, or scrapers to extract data in
                violation of API rate limits
              </li>
              <li>
                Misrepresent your identity or affiliation with any person or
                organization
              </li>
              <li>
                Upload or transmit viruses, malware, or any other malicious code
              </li>
              <li>Harass, abuse, or harm other users of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Intellectual Property
            </h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">
              5.1 Service Content
            </h3>
            <p>
              The Service interface, design, and original content are owned by
              Metascience Platform and are protected by copyright, trademark,
              and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              5.2 Third-Party Content
            </h3>
            <p>
              Academic papers, citation data, and metadata are sourced from
              third-party databases including:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                <strong>Semantic Scholar:</strong> Provided by Allen Institute
                for AI
              </li>
              <li>
                <strong>OpenAlex:</strong> Open scholarly metadata database
              </li>
              <li>
                <strong>OpenCitations:</strong> Open citation data service
              </li>
            </ul>
            <p>
              This content remains the property of the respective rights holders
              and databases. You must comply with their respective terms of
              service and licensing agreements.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              5.3 User Feedback
            </h3>
            <p>
              Any feedback, comments, or suggestions you provide about the
              Service may be used by us without any obligation to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Third-Party Services
            </h2>
            <p>
              The Service integrates with third-party academic databases and
              services. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                The availability, accuracy, or completeness of third-party data
              </li>
              <li>Changes to third-party APIs or services</li>
              <li>
                The terms of service or privacy policies of third-party
                providers
              </li>
            </ul>
            <p>
              Your use of third-party content is subject to their respective
              terms and conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Disclaimers and Limitations of Liability
            </h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">
              7.1 Service &quot;As Is&quot;
            </h3>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              7.2 Data Accuracy
            </h3>
            <p>
              We do not guarantee the accuracy, completeness, or reliability of
              any citation data, paper metadata, or analysis results. Users
              should independently verify critical information.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              7.3 Limitation of Liability
            </h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL
              METASCIENCE PLATFORM BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES,
              RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>
                Your access to or use of (or inability to access or use) the
                Service
              </li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Unauthorized access, use, or alteration of your content</li>
              <li>Any interruption or cessation of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Metascience
              Platform, its officers, directors, employees, and agents from any
              claims, liabilities, damages, losses, and expenses, including
              legal fees, arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Your access to or use of the Service</li>
              <li>Your violation of these Terms of Service</li>
              <li>Your violation of any third-party rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Data Retention and Deletion
            </h2>
            <p>
              We retain your account information and feedback data for as long
              as your account is active. You may request account deletion at any
              time by contacting us. Upon deletion:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Your account will be permanently deleted</li>
              <li>
                Your personal information will be removed from our systems
              </li>
              <li>
                Anonymized feedback data may be retained for analytical purposes
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms of Service at any time.
              We will notify users of any material changes by updating the
              &quot;Last Updated&quot; date at the top of this page. Your
              continued use of the Service after such changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Service Availability
            </h2>
            <p>
              We strive to maintain the Service&apos;s availability but do not
              guarantee uninterrupted access. The Service may be unavailable due
              to:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Scheduled maintenance</li>
              <li>Emergency repairs</li>
              <li>Third-party service outages</li>
              <li>Force majeure events</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in
              accordance with applicable international laws regarding online
              services, without regard to conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision shall be limited or eliminated to the
              minimum extent necessary, and the remaining provisions shall
              remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              14. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us through the feedback mechanism provided in the
              application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Acknowledgments</h2>
            <p>
              This service is inspired by the Local Citation Network project by
              Tim Woelfle. We acknowledge and appreciate the academic databases
              that make this service possible:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-4">
              <li>Semantic Scholar by Allen Institute for AI</li>
              <li>OpenAlex</li>
              <li>OpenCitations</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
