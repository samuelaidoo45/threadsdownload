const puppeteer = require('puppeteer');
const express = require('express');

const app = express();
const port = 3000;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to use EJS
app.set('view engine', 'ejs');

// Define a route for the homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Server route handler
app.post('/submit', async (req, res) => {
  try {
    const url = req.body.url;


    // const urlPattern = /^https:\/\/www\.threads\.net\/t\/[A-Za-z0-9_-]+\?igshid=[A-Za-z0-9_-]+$/;

    // if (!urlPattern.test(url)) {
    //       throw new Error('Valid URL is required');
    // } 

    const browser = await puppeteer.launch(); // Pass headless: "new"
    const page = await browser.newPage();

    const requests = [];

    const responses = [];

    const targetUrl = "https://www.threads.net/api/graphql";

    await page.on('request', async (request) => {
      const requestUrl = request.url();

      if (requestUrl === targetUrl) {

        const requestData = await request.postData();

        requests.push({ url: requestUrl, data: requestData });

      }
    });


    await page.on('response', async (response) => {
      const responseUrl = response.url();

      if (responseUrl === targetUrl) {

        const statusCode = response.status();

        if (statusCode === 301 || statusCode === 302) {
          console.log(`Skipped reading response body for redirect response (${statusCode}): ${responseUrl}`);
          return;
        }

        const responseData = await response.json(); // Use response.text() or response.json() to read the response data
        responses.push({ data: responseData });

      }
    });


    await page.goto(url, { waitUntil: 'networkidle2' });

    await browser.close();

    let data = responses[0].data.data;

    data = data.data;

    const links = [];

    // Assuming data is the response data you received

    if (
      data.containing_thread &&
      data.containing_thread.thread_items.length > 0 &&
      data.containing_thread.thread_items[0].post &&
      data.containing_thread.thread_items[0].post.image_versions2 &&
      data.containing_thread.thread_items[0].post.image_versions2.candidates &&
      data.containing_thread.thread_items[0].post.image_versions2.candidates.length > 0
    ) {
      links.push(data.containing_thread.thread_items[0].post.image_versions2.candidates[0].url);
    }

    if (
      data.containing_thread &&
      data.containing_thread.thread_items.length > 0 &&
      data.containing_thread.thread_items[0].post &&
      data.containing_thread.thread_items[0].post.video_versions &&
      data.containing_thread.thread_items[0].post.video_versions.length > 0
    ) {
      links.push(data.containing_thread.thread_items[0].post.video_versions[0].url);
    }

    console.log(links);

    res.render('media', { links });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${port}`);
});
