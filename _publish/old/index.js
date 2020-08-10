// TODO : NEXT : get async stuff to work


const fs = require('fs');
const { argv } = require('yargs');
const sanitize = require('sanitize-filename');

function run() {
    console.log('title...', title, 'date...', generateDateString(), 'font matter looks like...', frontMatter);
    console.log('file name...', generateFileName(frontMatter));
    console.log('do i get frontmatter?', generateFrontMatter(frontMatter));
    console.log('post id...', getPostId());
}

// 1. get a title
let title;
if (!argv.title)
    throw Error('you need a title:  --title=\'MY TITLE\'.  Thank you');
else
    title = argv.title;

// 2. make a date that is NOW
function generateDateString() {
    return new Date().toISOString().split('T')[0]
}
// 3. make a front matter object

const frontMatter = new FrontMatterTemplate(new Date(), title);

// 4. make a file name with NOW and the title

function generateFileName(frontMatter) {
    let title = frontMatter.title;
    title = title.replace(/\s+/g, '-');
    title = title.replace(/[^a-z0-9\-]/gi, '').toLocaleLowerCase();

    let fileName = '';
    fileName += frontMatter.date + '-';
    fileName += sanitize(title);
    fileName += '.md';

    return fileName;
}
// 5. find _posts at the root
// 6. write out frontMatter as YML (can i do this myself?)
function generateFrontMatter(frontMatter) {
    let result = '---\n';
    Object.keys(frontMatter).forEach(k => {
        result += k.toString() + ': ' + frontMatter[k].toString() + '\n';
    });
    result +='---\n\n';
    return result;
}
// 7. get a jwio_id
async function getPostId() {
    let lastFile = '';
    fs.readdir('_posts', (e, files) => {
        console.log('files...', files);
        lastFile = files[files.length - 1];
        console.log('lastFile...', lastFile);
        console.log('id?', getIdLine('_posts/' + lastFile));
        return  getIdLine('_posts/' + lastFile) + 1;
    });
}

async function getIdLine(fileName) {
    await fs.readFile(fileName, data => {
        const line =  data.split('\n')[1];
        return Number(line.substring(line.indexOf(':') + 2, line.length));
    });
}
// 8. write to file
// 9 log results


function FrontMatterTemplate(date, title) {
    this.jwio_id = -1;
    this.layout = 'post';
    this.title = title;
    this.subheading = 'SUBHEADING';
    this.date = generateDateString(date);
    this.lastModified = this.date;
    this.published = false;
    this.description = 'DESCRIPTION';
    this.tags = '\n - MY TAG';
    this.coverImage = 'COVER IMAGE';
    this.devto_id = -1;
}

run();
