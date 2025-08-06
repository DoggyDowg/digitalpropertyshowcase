import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const {
    tier,
    user_name,
    user_email,
    user_phone,
    is_selling_agent,
    agent_name,
    agent_email,
    agent_phone,
    agency_name,
    agency_office,
  } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Insert data into Supabase
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .insert([
        {
          tier,
          user_name,
          user_email,
          user_phone,
          is_selling_agent,
          agent_name: is_selling_agent ? null : agent_name,
          agent_email: is_selling_agent ? null : agent_email,
          agent_phone: is_selling_agent ? null : agent_phone,
          agency_name,
          agency_office,
        },
      ]);

    if (error) {
      console.error('Error inserting onboarding submission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send confirmation email
    try {
      await sendConfirmationEmail({
        user_email,
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the entire request if email fails
    }

    // Send internal notification email
    try {
      await sendInternalNotification({
        tier,
        user_name,
        user_email,
        user_phone,
        is_selling_agent,
        agent_name,
        agent_email,
        agent_phone,
        agency_name,
        agency_office,
      });
    } catch (emailError) {
      console.error('Error sending internal notification:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({ message: 'Submission successful', data });

  } catch (error) {
    console.error('Unexpected error during onboarding submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function to send confirmation email
async function sendConfirmationEmail({
  user_email,
}: {
  user_email: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'Digital Property Showcase <no-reply@digitalpropertyshowcase.com>',
    to: user_email,
    subject: 'Welcome to Digital Property Showcase - Submission Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://digitalpropertyshowcase.com/assets/logo/dps_small_logo.png" alt="Digital Property Showcase" style="width: 190px; height: 80px; max-width: 190px; max-height: 80px; margin-bottom: 20px;">
          <h2 style="color: #333; font-weight: normal;">Thank you for your submission!</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0;">We've successfully received your submission for a Digital Property Showcase. We're excited to help you get more multi-million dollar listings right away!</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #3A24C7;">What happens next?</h3>
          <ul style="padding-left: 20px;">
            <li>We will review your request</li>
            <li>We'll be in touch via email with all the info and assets we need from you (logos, branding, etc.)</li>
            <li>Payment will not be requested until the product is ready for delivery</li>
            <li>The whole process should take 2 business days from when we've received all the materials we need</li>
          </ul>
        </div>
        
        <div style="background-color: #f3f0ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3A24C7; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; color: #3A24C7;">Need immediate assistance?</p>
          <p style="margin: 5px 0 0 0;">Email: <a href="mailto:rick@digitalpropertyshowcase.com" style="color: #3A24C7;">rick@digitalpropertyshowcase.com</a></p>
          <p style="margin: 5px 0 0 0;">WhatsApp: <a href="https://wa.me/61488878040" style="color: #3A24C7;">+61 488 878 040</a></p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin: 0;">© 2025 Digital Property Showcase. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

// Function to send internal notification email
async function sendInternalNotification({
  tier,
  user_name,
  user_email,
  user_phone,
  is_selling_agent,
  agent_name,
  agent_email,
  agent_phone,
  agency_name,
  agency_office,
}: {
  tier: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  is_selling_agent: boolean;
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  agency_name: string;
  agency_office: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const internalEmails = process.env.INTERNAL_NOTIFICATION_EMAILS?.split(',') || [];
  
  if (internalEmails.length === 0) {
    console.log('No internal notification emails configured');
    return;
  }

  const tierDisplayName = tier.charAt(0).toUpperCase() + tier.slice(1);
  
  for (const email of internalEmails) {
    await resend.emails.send({
      from: 'Digital Property Showcase <no-reply@digitalpropertyshowcase.com>',
      to: email.trim(),
      subject: `New Onboarding Request - ${tierDisplayName} Tier`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://digitalpropertyshowcase.com/assets/logo/dps_small_logo.png" alt="Digital Property Showcase" style="width: 190px; height: 80px; max-width: 190px; max-height: 80px; margin-bottom: 20px;">
            <h2 style="color: #3A24C7; font-weight: normal;">New Onboarding Request</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #3A24C7; margin-top: 0;">Submission Details</h3>
            <p><strong>Selected Tier:</strong> ${tierDisplayName}</p>
            <p><strong>Agency Name:</strong> ${agency_name}</p>
            <p><strong>Office Location:</strong> ${agency_office}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #3A24C7; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${user_name}</p>
            <p><strong>Email:</strong> ${user_email}</p>
            <p><strong>Phone:</strong> ${user_phone}</p>
            <p><strong>Is Selling Agent:</strong> ${is_selling_agent ? 'Yes' : 'No'}</p>
          </div>
          
          ${!is_selling_agent && agent_name ? `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #3A24C7; margin-top: 0;">Agent Information</h3>
            <p><strong>Agent Name:</strong> ${agent_name}</p>
            <p><strong>Agent Email:</strong> ${agent_email || 'Not provided'}</p>
            <p><strong>Agent Phone:</strong> ${agent_phone || 'Not provided'}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">© 2025 Digital Property Showcase. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }
}