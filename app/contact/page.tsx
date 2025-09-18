'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Shield } from "lucide-react";
import { BusinessPhone, BusinessEmail, BusinessAddress } from "@/components/ui/global-editable-text";
import { EditableText } from "@/components/ui/editable-text";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95" />
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-4 py-2 text-sm font-semibold mb-6"
            >
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Available 7 Days • Quick Response</span>
            </motion.div>

            <EditableText
              contentKey="contact_page_title"
              tagName="h1"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent"
              placeholder="Contact Us"
            >
              Get in Touch
            </EditableText>
            <EditableText
              contentKey="contact_page_subtitle"
              tagName="p"
              className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
              placeholder="We'd love to hear from you! Whether you have a question about our packages, need assistance with booking, or just want to say hello, feel free to reach out."
              multiline={true}
              maxLength={300}
            >
              We'd love to hear from you! Whether you have a question about our packages, need assistance with booking, or just want to say hello, feel free to reach out.
            </EditableText>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Contact Methods */}
            <div className="space-y-6">
              {/* Phone Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-2xl">
                  <Phone className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Phone</h3>
                  <a
                    href={`tel:${undefined}`}
                    className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                  >
                    <BusinessPhone />
                  </a>
                </div>
              </motion.div>

              {/* Email Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-2xl">
                  <Mail className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Email</h3>
                  <a
                    href={`mailto:${undefined}`}
                    className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                  >
                    <BusinessEmail />
                  </a>
                </div>
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-start space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-2xl">
                  <MapPin className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Service Area</h3>
                  <div className="text-gray-600 font-medium">
                    <BusinessAddress />
                  </div>
                </div>
              </motion.div>

              {/* Operating Hours */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Operating Hours</h3>
                </div>
                <div className="space-y-1">
                  <EditableText
                    contentKey="operating_days"
                    tagName="div"
                    className="font-semibold text-emerald-100"
                    placeholder="Monday - Sunday"
                  >
                    Monday - Sunday
                  </EditableText>
                  <EditableText
                    contentKey="operating_hours"
                    tagName="div"
                    className="text-white/90"
                    placeholder="7:00 AM - 7:00 PM"
                  >
                    7:00 AM - 7:00 PM
                  </EditableText>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border border-emerald-100 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-emerald-100 p-2 rounded-xl">
                    <MessageCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    <EditableText
                      contentKey="contact_form_title"
                      tagName="span"
                      placeholder="Send a Message"
                    >
                      Send a Message
                    </EditableText>
                  </CardTitle>
                </div>
                <p className="text-gray-600">We'll get back to you within 24 hours</p>
              </CardHeader>
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">
                        <EditableText
                          contentKey="contact_form_name_label"
                          tagName="span"
                          placeholder="Name"
                        >
                          Name
                        </EditableText>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your Name"
                        className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">
                        <EditableText
                          contentKey="contact_form_phone_label"
                          tagName="span"
                          placeholder="Phone (Optional)"
                        >
                          Phone (Optional)
                        </EditableText>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Your phone number"
                        className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                      <EditableText
                        contentKey="contact_form_email_label"
                        tagName="span"
                        placeholder="Email"
                      >
                        Email
                      </EditableText>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 mb-2 block">
                      <EditableText
                        contentKey="contact_form_subject_label"
                        tagName="span"
                        placeholder="Subject"
                      >
                        Subject
                      </EditableText>
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="What's this about?"
                      className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-semibold text-gray-700 mb-2 block">
                      <EditableText
                        contentKey="contact_form_message_label"
                        tagName="span"
                        placeholder="Message"
                      >
                        Message
                      </EditableText>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 min-h-[120px]"
                      rows={5}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-4 text-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 rounded-xl"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    <EditableText
                      contentKey="contact_form_submit_button"
                      tagName="span"
                      placeholder="Send Message"
                    >
                      Send Message
                    </EditableText>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <EditableText
                  contentKey="contact_additional_title"
                  tagName="h2"
                  className="text-2xl sm:text-3xl font-bold mb-4"
                  placeholder="Get Started Today"
                >
                  Ready to Start Your Driving Journey?
                </EditableText>
                <EditableText
                  contentKey="contact_additional_subtitle"
                  tagName="p"
                  className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto"
                  placeholder="Ready to start your driving journey? We're here to help you every step of the way."
                  multiline={true}
                >
                  We're here to help you every step of the way, from your first lesson to passing your test.
                </EditableText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    <EditableText
                      contentKey="contact_cta_phone_title"
                      tagName="span"
                      placeholder="Call Us"
                    >
                      Call Us Now
                    </EditableText>
                  </h3>
                  <EditableText
                    contentKey="contact_cta_phone_desc"
                    tagName="p"
                    className="text-emerald-100"
                    placeholder="Speak directly with our friendly team"
                    multiline={true}
                  >
                    Speak directly with our friendly team
                  </EditableText>
                </div>

                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    <EditableText
                      contentKey="contact_cta_email_title"
                      tagName="span"
                      placeholder="Email Us"
                    >
                      Email Us
                    </EditableText>
                  </h3>
                  <EditableText
                    contentKey="contact_cta_email_desc"
                    tagName="p"
                    className="text-emerald-100"
                    placeholder="Send us your questions anytime"
                    multiline={true}
                  >
                    Send us your questions anytime
                  </EditableText>
                </div>

                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    <EditableText
                      contentKey="contact_cta_location_title"
                      tagName="span"
                      placeholder="Meet In Person"
                    >
                      Service Area
                    </EditableText>
                  </h3>
                  <EditableText
                    contentKey="contact_cta_location_desc"
                    tagName="p"
                    className="text-emerald-100"
                    placeholder="We serve the greater Brisbane area"
                    multiline={true}
                  >
                    We serve the greater Brisbane area
                  </EditableText>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}