# vue-laravel-table

![](https://img.shields.io/npm/dw/vue-laravel-table) ![](https://img.shields.io/npm/v/vue-laravel-table?color=#00baff)

Very simple to use Vue single-file-component that will take [Laravel](https://laravel.com) data that has the pagination included and turn it into a table that is stylized with [BS4](https://getbootstrap.com/). Read instructions below. ***It even has a loading animation!***

  

## Requirements

[Laravel](https://laravel.com) <br />[Axios](https://github.com/axios/axios)  <br />


## Installing

`npm install vue-laravel-table`<br />
Register the component in your Vue setup.

  

## Usage

Example:

```js
import VueLaravelTable from './VueLaravelTable';
const app = new Vue({
    el: '#app',
    components: {
    	VueLaravelTable
    }
});
```


```html
<div id="app">
	<vue-laravel-table
	 laravel-data-url="http://table-test.test/datatable/users"
         :laravel-data-resource="{ name: 'users', prefix: 'dashboard' }"
         :show-actions="['create', 'show', 'edit', 'delete']"
         :show-action-icons="true"
         :show-per-page="true"
         :hide-columns="['created_at', 'id']"
         :searchable-columns="['name']"
         :orderable-columns="['name', 'email']"
         csrf-token="your_csrf_token"
     />
</div>
```

​     

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class DatatableController extends Controller
{   
    /**
     * Users table
     *
     * @return JSON
     */
    public static function users(Request $request)
    {
        // What we want
        $users = User::select(['id', 'name', 'email', 'created_at']);

        // If there is a search query, we search
        if ($request->query('q')) {
            $users = $users->where(function($q) use($request) { 
                $qC = explode(',', $request->query('qC'));
                foreach ($qC as $c) {
                    $q->where($c, 'LIKE', '%'. $request->query('q') .'%');
                }
            });
        }

        // If there is orderBy
        if ($request->query('orderBy') && $request->query('orderDirection')) {
            $users = $users->orderBy($request->query('orderBy'), $request->query('orderDirection'));
        }

        $users = $users->paginate($request->query('perPage'));
        return response()->json($users);
    }
}
```




## Parameters:

-  **String**  `laravel-data-url`  ***Required***

   - Pretty self explanatory. You just pass the URL where you have the data you want in this table.
   - A simple example could be that you wanted to list users. So give the URL where you do that. The response from the URL **has** to be JSON.
   - All columns will be shown if not stated otherwise in `hide-columns` (explained further down).
-  **Object**  `:laravel-data-resource`  ***Required***

   - This object contains what type of resource it is that we're getting data from.
   - The object should contain both a name and a prefix *(last one is optional)*.
   - The `name` should be `users` if that is the resource you are grabbing. And the prefix is just in case you may have a prefix for your resource controller in Laravel. *No slashes needs to be added.*
-  **Array**  `:hide-columns`
   -  Pretty self explanatory. Just add the columns you do not want the table to render. But the columns and the data will still be there, just not rendered to the table.
-  **String**  `csrf-token`

   -  This is the csrf-token that Laravel uses. If you have decided to show the delete action in the `show-actions` prop, you should provide the `csrf-token`.
-  **Array**  `:show-actions`
   -  This is the kind of actions you want to show in the table.
   -  You can only choose from `create`, `show`, `edit` and `delete`.
   -  The three first ones will be shown as links to the correspondent resource. The delete however will be shown as a form with the hidden `_method` as `DELETE`
   -  It's worth mentioning all URL's here are generated with the resource controller standard that can be found in the [Laravel documentation](https://laravel.com/docs/8.x/controllers#resource-controllers).
-  **Boolean** `:show-action-icons`

   - Straight forward. Add font-awesome-free icon classes to the action buttons, instead of the action text. You'll need to have font-awesome styles included yourself. Icons will have these classes: `fas fa-fw fa-icon`.
-  **Array** `:searchable-columns`
   - Yes, there is a search function. Just put the columns that you want to be searchable in this array, and they will become searchable. ***Magic***
   - The query parameters are the following.. `q` is the query string (what you search for) and `qC` is the columns in the table that are going to be searched.
   - See the Laravel controller example above to get a better hang of it.
-  **Boolean** `:show-per-page`
   - Will display a items per page selector if set to true. By default the component will always grab 25 items per page. 
   - If you set this to true however, you can use the selector to grab 25, 50, 100, 250, 500 or 1000 items per page.
-  **Array** `:orderable-columns`
   - Here you can pass the column names that you want to be orderable. This basically means that you can click the table headers that responds to the given column name, and it will sort the table by ascending or descending order on that key.




## Other stuff

The component is styled using BS4 classes. Oh, there is also pagination here. There is also a minimalistic loading spinner when the data is retrieved. This can be seen at the right side of the pagination links. Remember to install or use BS4 so the component actually looks nice. Also, [font-awesome](https://fontawesome.com/) is needed when setting the prop `:show-action-icons` to true.
