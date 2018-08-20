
document.addEventListener('DOMContentLoaded', async () => {
    const mainForm = document.querySelector('#main-form')
    const form = document.querySelector('form')
    const submitButton = form.querySelector('button')
    const ul = document.querySelector('.main ul')
    const input = form.querySelector('input')
    const clearButton = mainForm.querySelector('#clear-button')
    const savePreferencesButton = document.querySelector(
        '#savePreferencesButton'
    )

    const UserID = document.querySelector('#UserID_Input_Field')
    const APIToken = document.querySelector('#APIToken_Input_Field')
    const FilterKeyword = document.querySelector('#FilterKeyword')

    savePreferencesButton.addEventListener('click', () => {
        localStorage.setItem('apiKey', APIToken.value)
        localStorage.setItem('tagString', FilterKeyword.value)
        localStorage.setItem('apiUser', UserID.value)

        location.reload()
    })

    let apiKey
    let tagString
    let apiUser
    if (localStorage.getItem('apiKey') === null) {
        apiKey = null
    } else {
        apiKey = localStorage.getItem('apiKey')
        APIToken.value = apiKey
    }
    if (localStorage.getItem('tagString') === null) {
        tagString = null
    } else {
        tagString = localStorage.getItem('tagString')
        FilterKeyword.value = tagString
    }
    if (localStorage.getItem('apiUser') === null) {
        apiUser = null
    } else {
        apiUser = localStorage.getItem('apiUser')
        UserID.value = apiUser
    }
    if ((apiKey, tagString, apiUser)) {
        const fetchedTasks = await fetch(
            'https://habitica.com/api/v3/tasks/user',
            {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'x-api-user': apiUser
                }
            }
        )
        const { data: tasks } = await fetchedTasks.json()

        const allTasks = tasks.map(async task => {
            if (task.tags.length > 0) {
                const promisedTags = task.tags.map(async tag => {
                    const fetchedTag = await fetch(
                        `https://habitica.com/api/v3/tags/${tag}`,
                        {
                            method: 'GET',
                            headers: {
                                'x-api-key': apiKey,
                                'x-api-user': apiUser
                            }
                        }
                    )
                    const { data } = await fetchedTag.json()
                    return data
                })
                const fetchedAllTags = await Promise.all(promisedTags)
                return fetchedAllTags
            }
        })
        const fetchedAllTagNames = await Promise.all(allTasks)

        const legitTags = fetchedAllTagNames.filter(
            tagName => tagName !== undefined
        )

        const flattened = await flatten(legitTags)
        function flatten(arr) {
            return arr.reduce(function(flat, toFlatten) {
                return flat.concat(
                    Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
                )
            }, [])
        }

        const filteredTag = await flattened.filter(
            tagName => tagName.name === tagString
        )

        const tasksList = tasks.filter(task =>
            task.tags.includes(filteredTag[0].id)
        )
        console.log(tasksList)

        const createListContent = (text, id) => {
            const span = document.createElement('span')
            const li = document.createElement('li')
            span.textContent = text
            li.appendChild(span)
            ul.appendChild(li)
            createButtons(li, id)
        }

        //Create and attach buttons onto list items
        const createButtons = (li, id) => {
            const listItem = li.firstElementChild
            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.dataset.id = id
            li.insertBefore(checkbox, listItem)

            // //TODO: Add remove button functionality
            // const removeButton = document.createElement('button')
            // removeButton.textContent = 'x'
            // removeButton.className = 'remove'
            // li.insertBefore(removeButton, listItem.nextElementSibling)
        }

        // Apply a class on checked list items
        ul.addEventListener('change', async e => {
            const li = e.target.parentNode
            const liItemName = e.target.nextElementSibling.textContent
            console.log(e.target.dataset.id)
            if (e.target.checked) {
                // complete the task
                const fetchedTag = await fetch(
                    `https://habitica.com/api/v3/tasks/${
                        e.target.dataset.id
                    }/score/up`,
                    {
                        method: 'POST',
                        headers: {
                            'x-api-key': apiKey,
                            'x-api-user': apiUser
                        }
                    }
                )

                const { success } = await fetchedTag.json()
                if (success) {
                    const li = e.target.parentNode
                    ul.removeChild(li)
                }
            } else {
                li.className = ''
                for (let i = 0; i < checkedArray.length; i++) {
                    if (liItemName === checkedArray[i]) {
                        checkedArray.splice(i, 1)
                        // setLocalStorage('checked', checkedArray)
                    }
                }
            }
        })

        // Submit task into input field
        form.addEventListener('submit', async e => {
            e.preventDefault()
            console.log(input.value)
            if (input.value === '') {
                errorMessage.textContent = 'Please enter a task'
            } else {
                const bodyData = {
                    text: input.value,
                    type: 'todo',
                    tags: [filteredTag[0].id],
                    priority: '1.5'
                }
                const postedTask = await fetch(
                    'https://habitica.com/api/v3/tasks/user',
                    {
                        method: 'POST',
                        headers: {
                            'x-api-key': apiKey,
                            'x-api-user': apiUser,
                            'Content-Type': 'application/json; charset=utf-8'
                        },
                        body: JSON.stringify(bodyData)
                    }
                )
                const { data, success } = await postedTask.json()
                console.log(data)
                if (success) {
                    createListContent(data.text, data.id)
                    input.value = ''
                }
            }
        })

        tasksList.reverse()
        tasksList.forEach(task => {
            createListContent(task.text, task.id)
        })
    }
})
