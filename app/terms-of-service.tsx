import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useTheme, type ThemeColors } from '@/theme';

const EFFECTIVE_DATE = 'April 4, 2026';
const LAST_UPDATED = 'April 4, 2026';

export default function TermsOfServiceScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.pageTitle}>CENTSIBLE SCHOLAR</Text>
      <Text style={styles.pageSubtitle}>Terms of Service</Text>
      <Text style={styles.meta}>Effective Date: {EFFECTIVE_DATE}</Text>
      <Text style={styles.meta}>Last Updated: {LAST_UPDATED}</Text>
      <Text
        style={[styles.meta, styles.link]}
        onPress={() => Linking.openURL('https://www.centsiblescholar.com')}
      >
        www.centsiblescholar.com
      </Text>

      {/* 1. Acceptance of Terms */}
      <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.body}>
        Welcome to Centsible Scholar ("App," "Service," "we," "us," or "our"),
        operated by Centsible Scholar, LLC. These Terms of Service ("Terms")
        constitute a legally binding agreement between you and Centsible Scholar,
        LLC governing your access to and use of the Centsible Scholar mobile
        application, web application at app.centsiblescholar.com, and all related
        services.
      </Text>
      <Text style={styles.bodyBold}>
        BY DOWNLOADING, INSTALLING, ACCESSING, OR USING THE APP, YOU ACKNOWLEDGE
        THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF
        YOU DO NOT AGREE, DO NOT USE THE SERVICE.
      </Text>
      <Text style={styles.body}>
        These Terms apply to all users, including parents, guardians, and any
        minor users who access the Service under parental supervision and account
        authorization.
      </Text>

      {/* 2. Eligibility and Account Registration */}
      <Text style={styles.sectionTitle}>
        2. Eligibility and Account Registration
      </Text>
      <Text style={styles.subheading}>2.1 Adult Users</Text>
      <Text style={styles.body}>
        To create a primary account, you must be at least 18 years of age. By
        creating an account, you represent that you are 18 or older and have the
        legal authority to enter into these Terms.
      </Text>
      <Text style={styles.subheading}>2.2 Minor Users</Text>
      <Text style={styles.body}>
        Centsible Scholar is designed to support families with children and
        students ages 13–24. Minor users (under 18) may only use the Service
        through a parent or guardian account. The parent or guardian:
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Is solely responsible for the minor's use of the Service;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Must provide all required consents, including any consents
        required under applicable children's privacy laws;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Agrees that these Terms apply to the minor's use of the
        Service.
      </Text>
      <Text style={styles.body}>
        Because the Service is designed for students ages 13 and older, we do not
        knowingly collect personal information from children under 13. If we
        learn that a child under 13 has provided personal information, we will
        delete it promptly. Parents who believe their child under 13 has used the
        Service should contact us immediately at legal@centsiblescholar.com.
      </Text>
      <Text style={styles.subheading}>2.3 Account Information</Text>
      <Text style={styles.body}>
        You agree to provide accurate, current, and complete information when
        creating an account and to update such information to keep it accurate.
        You are responsible for maintaining the confidentiality of your login
        credentials and for all activity that occurs under your account.
      </Text>

      {/* 3. Description of Service */}
      <Text style={styles.sectionTitle}>3. Description of Service</Text>
      <Text style={styles.body}>
        Centsible Scholar is a family platform integrating three core pillars:
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Behavior Management: Tools for parents and students to set
        behavioral goals, track progress, and build positive habits;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Academic & Grades Tracking: Features for monitoring academic
        performance, homework, and study goals;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Financial Literacy: Age-appropriate tools to teach earning,
        saving, budgeting, and responsible money management.
      </Text>
      <Text style={styles.body}>
        The Service may also include access to optional professional coaching
        sessions with licensed clinical professionals. Coaching services are
        separate from the core App subscription and are subject to additional
        terms described in Section 9.
      </Text>
      <Text style={styles.body}>
        We reserve the right to modify, suspend, or discontinue any feature of
        the Service at any time with reasonable notice where practicable.
      </Text>

      {/* 4. Free Trial and Subscription */}
      <Text style={styles.sectionTitle}>4. Free Trial and Subscription</Text>
      <Text style={styles.subheading}>4.1 Free Trial</Text>
      <Text style={styles.body}>
        We may offer a free trial period for new users. During the free trial,
        you will have access to designated features of the Service at no charge.
        At the end of the free trial period, continued access requires a paid
        subscription unless you cancel before the trial expires.
      </Text>
      <Text style={styles.body}>
        We reserve the right to modify or discontinue free trial offers at any
        time. Only one free trial per household is permitted.
      </Text>
      <Text style={styles.subheading}>4.2 Paid Subscription</Text>
      <Text style={styles.body}>
        Subscription plans, pricing, and billing cycles are described on our
        website and within the App. By subscribing, you authorize us (or our
        third-party payment processor) to charge your selected payment method on
        a recurring basis at the then-current subscription rate.
      </Text>
      <Text style={styles.subheading}>4.3 Cancellation</Text>
      <Text style={styles.body}>
        You may cancel your subscription at any time through your account
        settings or by contacting us at legal@centsiblescholar.com. Cancellation
        takes effect at the end of the current billing period. We do not provide
        refunds for partial billing periods except where required by applicable
        law.
      </Text>
      <Text style={styles.subheading}>4.4 Price Changes</Text>
      <Text style={styles.body}>
        We may change subscription pricing at any time. We will provide at least
        30 days' advance notice of any price increase. Continued use of the
        Service after a price change constitutes acceptance of the new pricing.
      </Text>
      <Text style={styles.subheading}>4.5 In-App Purchases</Text>
      <Text style={styles.body}>
        Any in-app purchases made through the Apple App Store or Google Play
        Store are subject to the respective platform's payment terms and refund
        policies. We do not control refunds for platform-processed purchases.
      </Text>

      {/* 5. Acceptable Use Policy */}
      <Text style={styles.sectionTitle}>5. Acceptable Use Policy</Text>
      <Text style={styles.body}>
        You agree to use the Service only for lawful purposes and in accordance
        with these Terms. You agree NOT to:
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Use the Service in any way that violates applicable federal,
        state, local, or international laws or regulations;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Impersonate any person or entity or misrepresent your
        affiliation with any person or entity;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Use the Service to transmit unsolicited commercial
        communications (spam);
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Attempt to gain unauthorized access to any portion of the
        Service or any other systems connected to the Service;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Reverse engineer, decompile, disassemble, or otherwise
        attempt to derive the source code of the App;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Upload, post, or transmit any content that is unlawful,
        harmful, abusive, harassing, defamatory, obscene, or otherwise
        objectionable;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Use the Service to collect or harvest any personally
        identifiable information about other users;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Interfere with or disrupt the integrity or performance of the
        Service or the data contained therein;
      </Text>
      <Text style={styles.bullet}>
        {'\u2022'} Use automated scripts, bots, or other automated means to
        access the Service.
      </Text>
      <Text style={styles.body}>
        We reserve the right to terminate or suspend your account immediately if
        you violate this Acceptable Use Policy.
      </Text>

      {/* 6. User Content */}
      <Text style={styles.sectionTitle}>6. User Content</Text>
      <Text style={styles.subheading}>6.1 Your Content</Text>
      <Text style={styles.body}>
        "User Content" means any information, data, text, or other material you
        submit to or through the Service, including behavioral goals, academic
        records, financial data, and communications. You retain ownership of your
        User Content.
      </Text>
      <Text style={styles.subheading}>6.2 License to Us</Text>
      <Text style={styles.body}>
        By submitting User Content, you grant Centsible Scholar a limited,
        non-exclusive, royalty-free, worldwide license to use, store, display,
        reproduce, and process your User Content solely to provide and improve
        the Service. This license terminates when you delete your account or the
        content, except where retention is required by law.
      </Text>
      <Text style={styles.subheading}>6.3 Content Standards</Text>
      <Text style={styles.body}>
        You are solely responsible for your User Content and represent that it
        does not violate any third-party rights or applicable law. We may, but
        are not obligated to, review, edit, or remove User Content that violates
        these Terms.
      </Text>

      {/* 7. Privacy and Data */}
      <Text style={styles.sectionTitle}>7. Privacy and Data</Text>
      <Text style={styles.body}>
        Your use of the Service is governed by our Privacy Policy, which is
        incorporated into these Terms by reference. Our Privacy Policy describes
        how we collect, use, share, and protect your personal information,
        including information about minor users.
      </Text>
      <Text style={styles.body}>
        Please review our Privacy Policy at www.centsiblescholar.com/privacy
        before using the Service. By using the Service, you consent to the data
        practices described in our Privacy Policy.
      </Text>
      <Text style={styles.body}>
        Parents and guardians may review, modify, or request deletion of their
        child's personal information by contacting us at
        legal@centsiblescholar.com. The Service is not intended for use by anyone
        under the age of 13.
      </Text>

      {/* 8. Intellectual Property */}
      <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
      <Text style={styles.subheading}>8.1 Our Content</Text>
      <Text style={styles.body}>
        All content, features, and functionality of the Service — including but
        not limited to software, text, graphics, logos, images, and the
        compilation thereof — are the exclusive property of Centsible Scholar,
        LLC or its licensors and are protected by copyright, trademark, and other
        intellectual property laws.
      </Text>
      <Text style={styles.subheading}>8.2 Limited License</Text>
      <Text style={styles.body}>
        Subject to these Terms, we grant you a limited, non-exclusive,
        non-transferable, revocable license to access and use the Service for
        your personal, non-commercial use. This license does not include the
        right to copy, modify, distribute, sell, or lease any part of the
        Service.
      </Text>
      <Text style={styles.subheading}>8.3 Feedback</Text>
      <Text style={styles.body}>
        If you submit feedback, suggestions, or ideas about the Service, you
        grant us an irrevocable, perpetual, royalty-free license to use such
        feedback without any obligation to compensate you.
      </Text>

      {/* 9. Professional Coaching Services */}
      <Text style={styles.sectionTitle}>
        9. Professional Coaching Services
      </Text>
      <Text style={styles.subheading}>9.1 Nature of Coaching</Text>
      <Text style={styles.body}>
        Centsible Scholar may offer optional coaching sessions with licensed
        clinical professionals, including Licensed Marriage and Family Therapists
        (LMFT) and Licensed Professional Counselors (LPC). These sessions are
        educational and supportive consultations.
      </Text>
      <Text style={styles.bodyBold}>
        IMPORTANT: Coaching sessions available through the Service do not
        constitute psychotherapy, mental health treatment, or a therapeutic
        relationship. No therapist-client relationship is formed. For mental
        health treatment, please consult a licensed mental health professional in
        your jurisdiction.
      </Text>
      <Text style={styles.subheading}>9.2 Booking and Cancellation</Text>
      <Text style={styles.body}>
        Coaching sessions are subject to coach availability. Cancellation
        policies for coaching sessions are provided at the time of booking.
        Coaching session fees are separate from App subscription fees and are
        non-refundable except as expressly stated at time of purchase.
      </Text>
      <Text style={styles.subheading}>9.3 No Emergency Services</Text>
      <Text style={styles.body}>
        The Service is NOT an emergency service. If you or someone in your family
        is experiencing a mental health emergency, please call 988 (Suicide and
        Crisis Lifeline), 911, or go to your nearest emergency room immediately.
      </Text>

      {/* 10. Disclaimers and Limitation of Liability */}
      <Text style={styles.sectionTitle}>
        10. Disclaimers and Limitation of Liability
      </Text>
      <Text style={styles.subheading}>10.1 Disclaimer of Warranties</Text>
      <Text style={styles.bodyBold}>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF
        ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
        UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL
        COMPONENTS.
      </Text>
      <Text style={styles.subheading}>10.2 Educational Purpose</Text>
      <Text style={styles.body}>
        The content and tools in Centsible Scholar are provided for educational
        and informational purposes only. They do not constitute financial, legal,
        medical, or psychological advice. Results may vary based on individual
        family circumstances and how the tools are used.
      </Text>
      <Text style={styles.subheading}>10.3 Limitation of Liability</Text>
      <Text style={styles.bodyBold}>
        TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, CENTSIBLE SCHOLAR,
        LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE
        LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF OR RELATED TO YOUR USE
        OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH
        DAMAGES.
      </Text>
      <Text style={styles.bodyBold}>
        OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO
        THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE
        AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) ONE
        HUNDRED U.S. DOLLARS ($100).
      </Text>

      {/* 11. Indemnification */}
      <Text style={styles.sectionTitle}>11. Indemnification</Text>
      <Text style={styles.body}>
        You agree to indemnify, defend, and hold harmless Centsible Scholar, LLC
        and its officers, directors, employees, and agents from and against any
        claims, liabilities, damages, judgments, awards, losses, costs, expenses,
        or fees (including reasonable attorneys' fees) arising from: (a) your use
        of the Service; (b) your User Content; (c) your violation of these
        Terms; or (d) your violation of any third-party rights.
      </Text>

      {/* 12. Third-Party Services and App Stores */}
      <Text style={styles.sectionTitle}>
        12. Third-Party Services and App Stores
      </Text>
      <Text style={styles.body}>
        The Service may integrate with or link to third-party services (such as
        payment processors and social login providers). We are not responsible
        for the content, privacy practices, or terms of any third-party service.
      </Text>
      <Text style={styles.body}>
        The App is made available through the Apple App Store and Google Play
        Store. Your use of the App through these platforms is also subject to the
        applicable platform terms of service. In the event of a conflict between
        these Terms and the platform terms, the platform terms govern solely with
        respect to the platform's services.
      </Text>
      <Text style={styles.body}>
        Apple Inc. and Google LLC are third-party beneficiaries of these Terms
        solely to the extent required by their platform policies. Neither Apple
        nor Google is responsible for the App or its content.
      </Text>

      {/* 13. Termination */}
      <Text style={styles.sectionTitle}>13. Termination</Text>
      <Text style={styles.body}>
        We may suspend or terminate your access to the Service at any time, with
        or without notice, for any reason, including if we believe you have
        violated these Terms.
      </Text>
      <Text style={styles.body}>
        You may terminate your account at any time by deleting your account
        within the App or contacting us at legal@centsiblescholar.com. Upon
        termination, your right to use the Service ceases immediately.
      </Text>
      <Text style={styles.body}>
        Sections 6.2, 8, 10, 11, and 14–17 survive termination of these Terms.
      </Text>

      {/* 14. Governing Law and Dispute Resolution */}
      <Text style={styles.sectionTitle}>
        14. Governing Law and Dispute Resolution
      </Text>
      <Text style={styles.subheading}>14.1 Governing Law</Text>
      <Text style={styles.body}>
        These Terms and any dispute arising hereunder shall be governed by the
        laws of the State of Louisiana, without regard to its conflict of law
        principles.
      </Text>
      <Text style={styles.subheading}>14.2 Informal Resolution</Text>
      <Text style={styles.body}>
        Before initiating any formal dispute, you agree to contact us at
        legal@centsiblescholar.com to attempt informal resolution. We will work
        in good faith to resolve most issues within 30 days.
      </Text>
      <Text style={styles.subheading}>14.3 Arbitration</Text>
      <Text style={styles.body}>
        If informal resolution fails, any dispute shall be resolved by binding
        individual arbitration administered by the American Arbitration
        Association (AAA) under its Consumer Arbitration Rules, which are
        available at www.adr.org. The arbitration shall take place in Louisiana
        or by video conference.
      </Text>
      <Text style={styles.subheading}>14.4 Class Action Waiver</Text>
      <Text style={styles.bodyBold}>
        YOU AND CENTSIBLE SCHOLAR AGREE THAT EACH MAY BRING CLAIMS AGAINST THE
        OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR
        CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE ACTION. This waiver may not
        be severed except in limited circumstances as required by applicable law.
      </Text>
      <Text style={styles.subheading}>14.5 Exceptions</Text>
      <Text style={styles.body}>
        Either party may seek injunctive or other equitable relief in any court
        of competent jurisdiction for matters involving intellectual property
        infringement or to prevent irreparable harm.
      </Text>

      {/* 15. Changes to These Terms */}
      <Text style={styles.sectionTitle}>15. Changes to These Terms</Text>
      <Text style={styles.body}>
        We may update these Terms from time to time. When we make material
        changes, we will notify you by email, in-app notification, or by
        updating the "Effective Date" at the top of this document. Your continued
        use of the Service after the effective date of revised Terms constitutes
        your acceptance of the changes.
      </Text>

      {/* 16. Miscellaneous */}
      <Text style={styles.sectionTitle}>16. Miscellaneous</Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Entire Agreement:</Text> These Terms, together
        with our Privacy Policy and any additional terms for specific features,
        constitute the entire agreement between you and Centsible Scholar
        regarding the Service.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Severability:</Text> If any provision of these
        Terms is found to be unenforceable, the remaining provisions will
        continue in full force and effect.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Waiver:</Text> Our failure to enforce any
        right or provision of these Terms is not a waiver of that right or
        provision.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Assignment:</Text> You may not assign your
        rights under these Terms without our written consent. We may assign our
        rights without restriction.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Force Majeure:</Text> We are not liable for
        delays or failures in performance resulting from circumstances beyond our
        reasonable control.
      </Text>

      {/* 17. Contact Information */}
      <Text style={styles.sectionTitle}>17. Contact Information</Text>
      <Text style={styles.body}>
        If you have any questions about these Terms, please contact us:
      </Text>
      <Text style={styles.body}>Centsible Scholar, LLC</Text>
      <Text
        style={[styles.body, styles.link]}
        onPress={() =>
          Linking.openURL('mailto:legal@centsiblescholar.com')
        }
      >
        Email: legal@centsiblescholar.com
      </Text>
      <Text
        style={[styles.body, styles.link]}
        onPress={() =>
          Linking.openURL('https://www.centsiblescholar.com')
        }
      >
        Website: www.centsiblescholar.com
      </Text>
      <Text
        style={[styles.body, styles.link]}
        onPress={() =>
          Linking.openURL('https://app.centsiblescholar.com')
        }
      >
        App: app.centsiblescholar.com
      </Text>

      <Text style={styles.copyright}>
        {'\u00A9'} 2026 Centsible Scholar, LLC. All rights reserved.
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    contentContainer: {
      padding: 20,
    },
    pageTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    meta: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: 'center',
      marginBottom: 2,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginTop: 28,
      marginBottom: 10,
    },
    subheading: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 6,
    },
    body: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    bodyBold: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 10,
    },
    bold: {
      fontWeight: '700',
      color: colors.text,
    },
    bullet: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 4,
      paddingLeft: 16,
    },
    link: {
      color: colors.primary,
    },
    copyright: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 32,
    },
  });
