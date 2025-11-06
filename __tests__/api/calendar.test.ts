describe('POST /api/calendar/book', () => {
  it('should book a valid time slot and return a success response', async () => {
    let response;
    try {
      response = await fetch('http://localhost:3000/api/calendar/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: '2025-12-25',
          time: '10:00',
          lessonType: 'Standard',
          duration: 60,
          studentName: 'John Doe',
          studentEmail: 'john.doe@example.com',
          notes: 'Test booking',
        }),
      });
      console.log('Fetch response:', response);
    } catch (error) {
      console.error('Fetch failed:', error);
    }

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});