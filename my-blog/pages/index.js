// pages/index.js

import {getAllPosts} from 'api/index'

export default function Blog() {
    const posts = getAllPosts();
    console.log(posts)
    return (
        <div>Hello world!</div>
    )
}