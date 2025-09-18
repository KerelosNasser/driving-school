import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing packages...');
    
    // Check if packages already exist
    const { data: existingPackages, error: checkError } = await supabase
      .from('packages')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking packages:', checkError);
      return NextResponse.json({
        error: 'Failed to check existing packages',
        details: checkError.message
      }, { status: 500 });
    }

    if (existingPackages && existingPackages.length > 0) {
      return NextResponse.json({
        message: 'Packages already exist',
        count: existingPackages.length
      });
    }

    // Create initial packages
    const packagesToCreate = [
      {
        name: 'Starter Package',
        description: 'Perfect for beginners who are just starting their driving journey',
        price: 299.99,
        hours: 5,
        features: ['5 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling'],
        popular: false
      },
      {
        name: 'Standard Package',
        description: 'Our most popular package for learners with some experience',
        price: 499.99,
        hours: 10,
        features: ['10 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling', 'Test preparation'],
        popular: true
      },
      {
        name: 'Premium Package',
        description: 'Comprehensive package for complete preparation',
        price: 799.99,
        hours: 20,
        features: ['20 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling', 'Test preparation', 'Mock driving test', 'Pick-up and drop-off service'],
        popular: false
      }
    ];

    const { data: createdPackages, error: createError } = await supabase
      .from('packages')
      .insert(packagesToCreate)
      .select();

    if (createError) {
      console.error('Error creating packages:', createError);
      return NextResponse.json({
        error: 'Failed to create packages',
        details: createError.message
      }, { status: 500 });
    }

    console.log('Packages created successfully:', createdPackages);

    return NextResponse.json({
      message: 'Packages created successfully',
      packages: createdPackages,
      count: createdPackages?.length || 0
    });

  } catch (error) {
    console.error('Init packages error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}